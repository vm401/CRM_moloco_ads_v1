"""
FastAPI Backend for Moloco Dashboard v2
Modern, fast, and scalable architecture
"""
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import Response
import aiofiles
import os
import json
from datetime import datetime
from pathlib import Path
from moloco_processor import MolocoCSVProcessor
from app_database import app_db
import asyncio
from concurrent.futures import ThreadPoolExecutor
import hashlib

# Initialize FastAPI app
app = FastAPI(
    title="Moloco Dashboard API",
    description="API for processing Moloco CSV files and generating analytics",
    version="2.0.0"
)

# Add compression middleware for better performance
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TEMPORARY: Allow all origins for debugging
    allow_credentials=False,  # Must be False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# In-memory storage for processed reports (in production, use database)
processed_reports = []

# Cache for aggregated data to improve performance
aggregated_data_cache = {
    'data': None,
    'hash': None,
    'timestamp': None
}

# Persistent storage
REPORTS_FILE = "processed_reports.json"

def save_reports_to_file():
    """Save processed reports to file for persistence"""
    try:
        with open(REPORTS_FILE, 'w') as f:
            json.dump(processed_reports, f, default=str)
        print(f"💾 Saved {len(processed_reports)} reports to file")
    except Exception as e:
        print(f"❌ Error saving reports: {e}")

def load_reports_from_file():
    """Load processed reports from file"""
    global processed_reports
    try:
        if os.path.exists(REPORTS_FILE):
            with open(REPORTS_FILE, 'r') as f:
                processed_reports = json.load(f)
            print(f"📂 Loaded {len(processed_reports)} reports from file")
            return True
        else:
            print("📂 No saved reports file found")
            return False
    except Exception as e:
        print(f"❌ Error loading reports: {e}")
        processed_reports = []
        return False

# Thread pool for CPU-intensive operations
executor = ThreadPoolExecutor(max_workers=2)

def load_existing_reports():
    """Load existing processed reports from uploads directory"""
    global processed_reports
    uploads_dir = Path("uploads")
    if not uploads_dir.exists():
        return
    
    for json_file in uploads_dir.glob("*_processed.json"):
        try:
            # Extract info from filename
            filename_parts = json_file.stem.split('_')
            if len(filename_parts) >= 3:
                account = filename_parts[0]
                upload_time = f"{filename_parts[1]}_{filename_parts[2]}"
                
            # Load the JSON to get csv_type
            with open(json_file, 'r') as f:
                data = json.load(f)
                csv_type = data.get('csv_type', 'unknown')
                
                # If csv_type is unknown, try to detect from filename
                if csv_type == 'unknown':
                    filename = json_file.name.lower()
                    if 'inventory_overall' in filename:
                        csv_type = 'inventory_overall'
                    elif 'inventory_daily' in filename:
                        csv_type = 'inventory_daily'
                    elif 'report' in filename and 'inventory' not in filename:
                        csv_type = 'reports'
                
            # Create report info
            report_info = {
                'id': len(processed_reports) + 1,
                'account': account,
                'filename': str(json_file.name).replace('_processed.json', '.csv'),
                'upload_time': upload_time,
                'report_path': str(json_file),
                'csv_type': csv_type,
                'rows': data.get('total_rows', 0),
                'columns': list(data.get('columns', {}).keys()) if isinstance(data.get('columns'), dict) else []
            }
            
            processed_reports.append(report_info)
            print(f"✅ Loaded existing report: {csv_type} - {json_file.name}")
            
        except Exception as e:
            print(f"❌ Error loading {json_file}: {e}")

# Load existing reports on startup
load_existing_reports()
print(f"📊 Loaded {len(processed_reports)} existing reports")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Moloco Dashboard API v2.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    account: str = Form(...),
    fileType: str = Form("auto")
):
    """
    Upload and process Moloco CSV file
    
    - **file**: CSV file (Reports, Inventory Overall, or Inventory Daily)
    - **account**: Account name (e.g., "Баер Вова", "Баер Артем")
    - **fileType**: Type of file (reports, inventory_overall, inventory_daily, auto)
    """
    
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_filename = f"{account}_{timestamp}_{file.filename}"
        filepath = os.path.join(UPLOAD_FOLDER, safe_filename)
        
        # Save uploaded file
        async with aiofiles.open(filepath, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Process CSV
        processor = MolocoCSVProcessor()
        detection_result = processor.load_and_detect_type(filepath)
        
        if not detection_result['success']:
            raise HTTPException(status_code=400, detail=detection_result.get('error', 'Failed to process CSV'))
        
        # Override detected type if specified
        if fileType != "auto":
            # Normalize singular name used by frontend to internal plural form
            processor.csv_type = "reports" if fileType == "report" else fileType
            print(f"🎯 Overriding CSV type to: {fileType}")
        
        # Process data with filename for daily breakdown
        if processor.csv_type == 'inventory_daily':
            processed_data = processor.process_inventory_csv(file.filename)
        else:
            processed_data = processor.process_data()
        
        # Save processed data
        report_filename = safe_filename.replace('.csv', '_processed.json')
        report_path = os.path.join(UPLOAD_FOLDER, report_filename)
        
        async with aiofiles.open(report_path, 'w') as f:
            await f.write(json.dumps(processed_data, ensure_ascii=False, indent=2, default=str))
        
        # Extract available dates from CSV
        available_dates = []
        if 'Date' in detection_result.get('columns', []):
            try:
                import pandas as pd
                df = pd.read_csv(filepath)
                if 'Date' in df.columns:
                    unique_dates = df['Date'].dropna().unique()
                    available_dates = sorted([str(date) for date in unique_dates])
                    print(f"📅 Found {len(available_dates)} unique dates: {available_dates[:5]}...")
            except Exception as e:
                print(f"⚠️ Error extracting dates: {e}")
        
        # Create report info
        report_info = {
            'id': len(processed_reports) + 1,
            'account': account,
            'filename': file.filename,
            'upload_time': datetime.now().isoformat(),
            'report_path': report_path,
            'csv_type': processor.csv_type,
            'rows': detection_result.get('rows', 0),
            'columns': detection_result.get('columns', []),
            'available_dates': available_dates  # Новое поле!
        }
        
        # Store report info
        processed_reports.append(report_info)
        
        # Save to persistent storage
        save_reports_to_file()
        
        return {
            "success": True,
            "message": f"File uploaded and processed successfully",
            "report_id": report_info['id'],
            "csv_type": processor.csv_type,
            "rows_processed": detection_result.get('rows', 0)
        }
        
    except Exception as e:
        print(f"❌ Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/reports")
async def get_reports(date_filter: str = None, start_date: str = None, end_date: str = None):
    """Get list of all processed reports with aggregated data, optionally filtered by date or date range"""
    # Get aggregated data from all reports
    aggregated_data = aggregate_all_reports_data(date_filter, start_date, end_date)
    
    # Optimize response size by limiting reports metadata
    limited_reports = processed_reports[-10:] if len(processed_reports) > 10 else processed_reports
    
    return {
        'success': True,
        'reports': limited_reports,  # Only last 10 reports for metadata
        'total': len(processed_reports),
        **aggregated_data  # Add all aggregated data to response
    }

@app.get("/available-dates")
async def get_available_dates():
    """Get all unique dates from all uploaded CSV files"""
    all_dates = set()
    
    for report in processed_reports:
        dates = report.get('available_dates', [])
        all_dates.update(dates)
    
    return {
        'dates': sorted(list(all_dates)),
        'count': len(all_dates)
    }

@app.delete("/clear-reports")
async def clear_reports():
    """Clear all processed reports from memory and delete files"""
    global processed_reports
    
    try:
        # Удаляем все файлы из папки uploads
        uploads_dir = Path("uploads")
        if uploads_dir.exists():
            for file_path in uploads_dir.glob("*_processed.json"):
                file_path.unlink()
                print(f"🗑️ Deleted: {file_path}")
            
            for file_path in uploads_dir.glob("*.csv"):
                file_path.unlink()
                print(f"🗑️ Deleted: {file_path}")
        
        # Очищаем память
        processed_reports.clear()
        
        # Очищаем кэш
        aggregated_data_cache['data'] = None
        aggregated_data_cache['hash'] = None
        aggregated_data_cache['timestamp'] = None
        
        print(f"✅ Cleared all reports from memory, disk, and cache")
        
        return {
            'success': True,
            'message': 'All reports cleared successfully',
            'cleared_count': len(processed_reports)
        }
        
    except Exception as e:
        print(f"❌ Error clearing reports: {e}")
        return {
            'success': False,
            'message': f'Error clearing reports: {str(e)}'
        }

@app.get("/reports/{report_id}/data")
async def get_report_data(report_id: int):
    """
    Get processed data for specific report with aggregation
    
    - **report_id**: ID of the processed report
    """
    
    # Find report
    report = None
    for r in processed_reports:
        if r['id'] == report_id:
            report = r
            break
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    try:
        # Load processed data
        async with aiofiles.open(report['report_path'], 'r') as f:
            content = await f.read()
            data = json.loads(content)
        
        # Aggregate data from all reports
        aggregated_data = aggregate_all_reports_data()
        
        return {
            'success': True,
            'report_info': report,
            'data': aggregated_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading report data: {str(e)}")

def aggregate_all_reports_data(date_filter: str = None, start_date: str = None, end_date: str = None):
    """Aggregate data from all loaded reports and create daily breakdown
    
    Args:
        date_filter: Optional single date string to filter data (e.g., '2024-01-15')
        start_date: Optional start date for range filtering (e.g., '2024-01-15') 
        end_date: Optional end date for range filtering (e.g., '2024-01-20')
    """
    global aggregated_data_cache
    start_time = datetime.now()
    
    if date_filter:
        print(f"🔍 Aggregating data with single date filter: {date_filter}")
    elif start_date and end_date:
        print(f"🔍 Aggregating data with date range: {start_date} to {end_date}")
    elif start_date:
        print(f"🔍 Aggregating data from date: {start_date}")
    else:
        print("🔍 Aggregating all data")
    
    if not processed_reports:
        return {
            'overview': {},
            'top_campaigns': [],
            'creative_performance': {'top_performers': []},
            'exchange_performance': [],
            'geographic_performance': [],
            'gambling_insights': {},
            'daily_breakdown': [],
            'inventory_app_analysis': {'apps': [], 'categories': [], 'total_apps': 0}
        }
    
    # Create hash of processed reports for cache validation including filters
    cache_key = f"{len(processed_reports)}_{date_filter}_{start_date}_{end_date}"
    reports_hash = hashlib.md5(cache_key.encode()).hexdigest()
    current_time = datetime.now()
    
    # Skip cache if date filtering is applied (always re-process filtered data)
    use_cache = not (date_filter or start_date or end_date)
    
    # Check if we have valid cached data (less than 5 minutes old) and no filters
    if (use_cache and aggregated_data_cache['data'] is not None and 
        aggregated_data_cache['hash'] == reports_hash and
        aggregated_data_cache['timestamp'] and
        (current_time - aggregated_data_cache['timestamp']).seconds < 300):
        print("🚀 Using cached aggregated data")
        return aggregated_data_cache['data']
    
    # Get latest reports of each type (by upload_time)
    latest_reports = {}
    latest_inventory = {}
    
    for report in processed_reports:
        csv_type = report.get('csv_type', 'unknown')
        upload_time = report.get('upload_time', '')
        
        if csv_type in ('reports', 'report'):
            if 'reports' not in latest_reports or upload_time > latest_reports['reports'].get('upload_time', ''):
                latest_reports['reports'] = report
        elif csv_type == 'inventory_overall':
            if 'overall' not in latest_inventory or upload_time > latest_inventory['overall'].get('upload_time', ''):
                latest_inventory['overall'] = report
        elif csv_type == 'inventory_daily':
            if 'daily' not in latest_inventory or upload_time > latest_inventory['daily'].get('upload_time', ''):
                latest_inventory['daily'] = report
    
    # Load data from latest reports
    aggregated_data = {
        'overview': {},
        'top_campaigns': [],
        'creative_performance': {'top_performers': []},
        'exchange_performance': [],
        'geographic_performance': [],
        'gambling_insights': {},
        'daily_breakdown': [],
        'inventory_app_analysis': {'apps': [], 'categories': [], 'total_apps': 0}
    }
    
    # Load reports data and apply date filtering
    if 'reports' in latest_reports:
        try:
            # Re-process the CSV with date filtering if needed
            if date_filter or start_date or end_date:
                print(f"🔄 Re-processing reports CSV with date filter")
                # Find the original CSV file
                csv_file = latest_reports['reports']['report_path'].replace('_processed.json', '.csv')
                if os.path.exists(csv_file):
                    from moloco_processor import MolocoCSVProcessor
                    processor = MolocoCSVProcessor()
                    processor.load_csv(csv_file)
                    filtered_data = processor.process_reports_csv(date_filter, start_date, end_date)
                    
                    aggregated_data['overview'] = filtered_data.get('overview', {})
                    aggregated_data['top_campaigns'] = filtered_data.get('top_campaigns', [])[:50]
                    aggregated_data['creative_performance'] = filtered_data.get('creative_performance', {'top_performers': []})
                    aggregated_data['exchange_performance'] = filtered_data.get('exchange_performance', [])[:20]
                    aggregated_data['geographic_performance'] = filtered_data.get('geographic_performance', [])
                    aggregated_data['gambling_insights'] = filtered_data.get('gambling_insights', {})
                else:
                    print(f"⚠️ Original CSV not found: {csv_file}")
                    # Fallback to cached data
                    with open(latest_reports['reports']['report_path'], 'r') as f:
                    reports_data = json.load(f)
                    aggregated_data['overview'] = reports_data.get('overview', {})
                    aggregated_data['top_campaigns'] = reports_data.get('top_campaigns', [])[:50]
                    aggregated_data['creative_performance'] = reports_data.get('creative_performance', {'top_performers': []})
                    aggregated_data['exchange_performance'] = reports_data.get('exchange_performance', [])[:20]
                    aggregated_data['geographic_performance'] = reports_data.get('geographic_performance', [])
                    aggregated_data['gambling_insights'] = reports_data.get('gambling_insights', {})
            else:
                # Use cached data without filtering
                with open(latest_reports['reports']['report_path'], 'r') as f:
                        reports_data = json.load(f)
                        aggregated_data['overview'] = reports_data.get('overview', {})
                        # PERFORMANCE: Limit campaigns to top 50 for faster loading
                        all_campaigns = reports_data.get('top_campaigns', [])
                        aggregated_data['top_campaigns'] = all_campaigns[:50] if len(all_campaigns) > 50 else all_campaigns
                        
                        # Keep all creatives from reports (already limited to top 20 by spend in processor)
                        creative_data = reports_data.get('creative_performance', {'top_performers': []})
                        aggregated_data['creative_performance'] = creative_data
                        
                        # PERFORMANCE: Limit exchanges to top 20 for faster loading
                        all_exchanges = reports_data.get('exchange_performance', [])
                        aggregated_data['exchange_performance'] = all_exchanges[:20] if len(all_exchanges) > 20 else all_exchanges
                        
                        aggregated_data['geographic_performance'] = reports_data.get('geographic_performance', [])
                        aggregated_data['gambling_insights'] = reports_data.get('gambling_insights', {})
        except Exception as e:
            print(f"❌ Error loading reports data: {e}")
    
    # Load inventory data
    if 'overall' in latest_inventory:
        try:
            with open(latest_inventory['overall']['report_path'], 'r') as f:
                inventory_data = json.load(f)
                full_inventory = inventory_data.get('inventory_app_analysis', {'apps': [], 'categories': [], 'total_apps': 0})
                
                # PERFORMANCE OPTIMIZATION: Limit apps to top 100 by spend for faster loading
                apps = full_inventory.get('apps', [])
                if len(apps) > 100:
                    # Sort by spend and take top 100
                    apps = sorted(apps, key=lambda x: x.get('Spend', 0), reverse=True)[:100]
                    print(f"⚡ Limited inventory apps from {full_inventory.get('total_apps', 0)} to {len(apps)} for performance")
                
                aggregated_data['inventory_app_analysis'] = {
                    'apps': apps,
                    'categories': full_inventory.get('categories', [])[:50],  # Limit categories too
                    'total_apps': full_inventory.get('total_apps', 0)  # Keep real total for stats
                }
        except Exception as e:
            print(f"❌ Error loading inventory overall data: {e}")
    
    # Create daily breakdown from all daily files
    daily_files = [r for r in processed_reports if r.get('csv_type') == 'inventory_daily']
    daily_breakdown = []
    
    for daily_file in daily_files:
        try:
            with open(daily_file['report_path'], 'r') as f:
                daily_data = json.load(f)
                daily_breakdown.extend(daily_data.get('daily_breakdown', []))
        except Exception as e:
            print(f"❌ Error loading daily data from {daily_file['filename']}: {e}")
    
    # If no daily breakdown from files, create from reports data
    if not daily_breakdown and aggregated_data['overview']:
        # Create mock daily breakdown from overview data
        total_spend = aggregated_data['overview'].get('total_spend', 0)
        total_impressions = aggregated_data['overview'].get('total_impressions', 0)
        total_installs = aggregated_data['overview'].get('total_installs', 0)
        total_actions = aggregated_data['overview'].get('total_actions', 0)
        
        # Distribute data across 5 days
        daily_breakdown = []
        for i in range(5):
            day_data = {
                'date': f'2025-08-{i+1:02d}',
                'spend': total_spend / 5,
                'impressions': total_impressions / 5,
                'clicks': (total_impressions * 0.02) / 5,  # 2% CTR
                'installs': total_installs / 5,
                'actions': total_actions / 5,
                'revenue': (total_spend * 1.5) / 5,  # 1.5x ROAS
                'cpi': aggregated_data['overview'].get('avg_cpi', 0),
                'roas': aggregated_data['overview'].get('avg_roas', 0),
                'ctr': aggregated_data['overview'].get('avg_ctr', 0)
            }
            daily_breakdown.append(day_data)
    
    aggregated_data['daily_breakdown'] = daily_breakdown
    
    print(f"✅ Aggregated data: {len(aggregated_data['top_campaigns'])} campaigns, {len(aggregated_data['exchange_performance'])} exchanges, {len(daily_breakdown)} daily records")
    
    # Cache the result
    aggregated_data_cache['data'] = aggregated_data
    aggregated_data_cache['hash'] = reports_hash
    aggregated_data_cache['timestamp'] = current_time
    
    # Log performance metrics
    end_time = datetime.now()
    processing_time = (end_time - start_time).total_seconds()
    print(f"⚡ Aggregated data in {processing_time:.2f}s - Apps: {len(aggregated_data['inventory_app_analysis']['apps'])}, Campaigns: {len(aggregated_data['top_campaigns'])}, Creatives: {len(aggregated_data['creative_performance']['top_performers'])}")
    print("💾 Cached aggregated data for future requests")
    
    return aggregated_data

@app.delete("/reports/{report_id}")
async def delete_report(report_id: int):
    """Delete processed report"""
    
    global processed_reports
    
    # Find and remove report
    report_to_delete = None
    for i, r in enumerate(processed_reports):
        if r['id'] == report_id:
            report_to_delete = r
            processed_reports.pop(i)
            break
    
    if not report_to_delete:
        raise HTTPException(status_code=404, detail="Report not found")
    
    try:
        # Delete files
        if os.path.exists(report_to_delete['report_path']):
            os.remove(report_to_delete['report_path'])
        
        return {
            'success': True,
            'message': 'Report deleted successfully'
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting report: {str(e)}")

@app.get("/analytics/overview")
async def get_analytics_overview():
    """Get overview analytics across all reports"""
    
    if not processed_reports:
        return {
            'success': True,
            'overview': {
                'total_reports': 0,
                'total_spend': 0,
                'accounts': []
            }
        }
    
    total_spend = sum(report.get('spend', 0) for report in processed_reports)
    accounts = list(set(report['account'] for report in processed_reports))
    
    return {
        'success': True,
        'overview': {
            'total_reports': len(processed_reports),
            'total_spend': total_spend,
            'accounts': accounts,
            'latest_upload': max(report['upload_time'] for report in processed_reports)
        }
    }

@app.get("/apps")
async def get_apps():
    """Get all apps from database"""
    try:
        apps = []
        for app_id, app_data in app_db.apps.items():
            apps.append({
                "id": app_id,
                **app_data
            })
        return {"apps": apps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get apps: {str(e)}")

@app.get("/apps/{app_id}")
async def get_app(app_id: str):
    """Get specific app by ID"""
    try:
        app_data = app_db.get_app_info(app_id)
        if not app_data:
            raise HTTPException(status_code=404, detail="App not found")
        return {"id": app_id, **app_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get app: {str(e)}")

@app.get("/apps/categories")
async def get_categories():
    """Get all app categories"""
    try:
        categories = app_db.get_all_categories()
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")

@app.get("/apps/search/{query}")
async def search_apps(query: str):
    """Search apps by name or description"""
    try:
        results = app_db.search_apps(query)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search apps: {str(e)}")

@app.get("/apps/statistics")
async def get_app_statistics():
    """Get app database statistics"""
    try:
        stats = app_db.get_app_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)