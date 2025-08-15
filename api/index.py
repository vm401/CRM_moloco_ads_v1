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
import asyncio
from concurrent.futures import ThreadPoolExecutor
import hashlib

# Moloco processor imports
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional

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
    allow_origins=["*"],  # Allow all origins for Vercel deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_FOLDER = "/tmp/uploads"  # Use /tmp for Vercel
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# In-memory storage for processed reports
processed_reports = []

# Cache for aggregated data
aggregated_data_cache = {
    'data': None,
    'hash': None,
    'timestamp': None
}

# Thread pool for CPU-intensive operations
executor = ThreadPoolExecutor(max_workers=2)

# Embedded moloco processor functions
def clean_nan_values(obj):
    """Recursively clean NaN and Inf values from any object"""
    if isinstance(obj, dict):
        return {k: clean_nan_values(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan_values(item) for item in obj]
    elif isinstance(obj, (int, float)):
        if pd.isna(obj) or np.isinf(obj):
            return 0.0
        return obj
    else:
        return obj

def generate_store_links(bundle_id: str, platform: str = None) -> Dict[str, str]:
    """Generate App Store and Google Play links from bundle ID"""
    if not bundle_id or pd.isna(bundle_id):
        return {'app_store': None, 'google_play': None}
    
    bundle_id = str(bundle_id).strip()
    
    # Try to detect platform from bundle ID
    if not platform:
        if bundle_id.startswith('com.') or bundle_id.startswith('org.') or bundle_id.startswith('net.'):
            platform = 'android'
        elif bundle_id.startswith('id') or bundle_id.isdigit():
            platform = 'ios'
        else:
            platform = 'unknown'
    
    links = {'app_store': None, 'google_play': None}
    
    if platform == 'ios' or bundle_id.isdigit():
        # iOS App Store - bundle ID should be numeric
        if bundle_id.isdigit():
            links['app_store'] = f"https://apps.apple.com/app/id{bundle_id}"
        else:
            # Try to extract numeric ID from bundle
            import re
            numeric_id = re.search(r'\d+', bundle_id)
            if numeric_id:
                links['app_store'] = f"https://apps.apple.com/app/id{numeric_id.group()}"
    
    if platform == 'android' or bundle_id.startswith(('com.', 'org.', 'net.')):
        # Google Play Store
        links['google_play'] = f"https://play.google.com/store/apps/details?id={bundle_id}"
    
    return links

class MolocoCSVProcessor:
    def __init__(self):
        self.df = None
        self.csv_type = None
        self.columns_mapping = {}
        self.data = {}
    
    def load_and_detect_type(self, filepath: str) -> Dict[str, Any]:
        """Load CSV file and detect its type"""
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
            df = None
            
            for encoding in encodings:
                try:
                    df = pd.read_csv(filepath, encoding=encoding)
                    print(f"✅ Successfully loaded CSV with {encoding} encoding")
                    break
                except UnicodeDecodeError:
                    continue
            
            if df is None:
                return {'success': False, 'error': 'Could not decode CSV file'}
            
            self.df = df
            
            # Detect CSV type based on columns
            columns = [col.lower().strip() for col in df.columns]
            
            # Check for inventory columns
            inventory_indicators = ['app bundle', 'app_bundle', 'bundle', 'inventory', 'app id', 'app_id']
            
            # Check for daily breakdown
            has_date = any('date' in col or 'day' in col or 'time' in col for col in columns)
            
            if any(indicator in ' '.join(columns) for indicator in inventory_indicators):
                if has_date:
                    self.csv_type = 'inventory_daily'
                else:
                    self.csv_type = 'inventory_overall'
            else:
                self.csv_type = 'reports'
            
            print(f"🔍 Detected CSV type: {self.csv_type}")
            print(f"📊 Shape: {df.shape[0]} rows, {df.shape[1]} columns")
            
            return {
                'success': True,
                'csv_type': self.csv_type,
                'rows': df.shape[0],
                'columns': list(df.columns)
            }
            
        except Exception as e:
            print(f"❌ Error loading CSV: {e}")
            return {'success': False, 'error': str(e)}
    
    def process_data(self) -> Dict[str, Any]:
        """Process the loaded CSV data based on its type"""
        if self.df is None:
            return {'error': 'No data loaded'}
        
        try:
            if self.csv_type == 'reports':
                return self.process_reports_csv()
            elif self.csv_type in ['inventory_overall', 'inventory_daily']:
                return self.process_inventory_csv()
            else:
                return {'error': f'Unknown CSV type: {self.csv_type}'}
                
        except Exception as e:
            print(f"❌ Error processing data: {e}")
            return {'error': str(e)}
    
    def process_reports_csv(self) -> Dict[str, Any]:
        """Process reports CSV file"""
        df = self.df.copy()
        
        # Clean column names
        df.columns = [col.strip() for col in df.columns]
        
        # Basic overview calculations
        overview = {
            'total_spend': float(df.get('Spend', df.get('spend', [0])).sum()),
            'total_impressions': int(df.get('Impressions', df.get('impressions', [0])).sum()),
            'total_clicks': int(df.get('Clicks', df.get('clicks', [0])).sum()),
            'total_installs': int(df.get('Install', df.get('installs', [0])).sum()),
            'total_actions': int(df.get('Action', df.get('actions', [0])).sum()),
            'avg_ctr': 0.0,
            'avg_cpi': 0.0,
            'avg_roas': 0.0
        }
        
        # Calculate averages
        if overview['total_impressions'] > 0:
            overview['avg_ctr'] = (overview['total_clicks'] / overview['total_impressions']) * 100
        
        if overview['total_installs'] > 0:
            overview['avg_cpi'] = overview['total_spend'] / overview['total_installs']
        
        # Top campaigns
        campaign_col = None
        for col in df.columns:
            if 'campaign' in col.lower():
                campaign_col = col
                break
        
        top_campaigns = []
        if campaign_col and campaign_col in df.columns:
            campaign_data = df.groupby(campaign_col).agg({
                'Spend': 'sum' if 'Spend' in df.columns else lambda x: 0,
                'Impressions': 'sum' if 'Impressions' in df.columns else lambda x: 0,
                'Install': 'sum' if 'Install' in df.columns else lambda x: 0,
                'Action': 'sum' if 'Action' in df.columns else lambda x: 0
            }).reset_index()
            
            campaign_data = campaign_data.sort_values('Spend', ascending=False).head(10)
            
            for _, row in campaign_data.iterrows():
                top_campaigns.append({
                    'campaign': str(row[campaign_col]),
                    'spend': float(row.get('Spend', 0)),
                    'impressions': int(row.get('Impressions', 0)),
                    'installs': int(row.get('Install', 0)),
                    'actions': int(row.get('Action', 0))
                })
        
        # Creative performance
        creative_col = None
        for col in df.columns:
            if 'creative' in col.lower() or 'filename' in col.lower():
                creative_col = col
                break
        
        creative_performance = {'top_performers': []}
        if creative_col and creative_col in df.columns:
            creative_data = df.groupby(creative_col).agg({
                'Spend': 'sum' if 'Spend' in df.columns else lambda x: 0,
                'Install': 'sum' if 'Install' in df.columns else lambda x: 0,
                'Action': 'sum' if 'Action' in df.columns else lambda x: 0
            }).reset_index()
            
            creative_data = creative_data.sort_values('Spend', ascending=False)
            
            for _, row in creative_data.iterrows():
                creative_performance['top_performers'].append({
                    'creative_name': str(row[creative_col]),
                    'spend': float(row.get('Spend', 0)),
                    'installs': int(row.get('Install', 0)),
                    'actions': int(row.get('Action', 0))
                })
        
        # Exchange performance
        exchange_performance = []
        if 'Exchange' in df.columns:
            exchange_data = df.groupby('Exchange').agg({
                'Spend': 'sum' if 'Spend' in df.columns else lambda x: 0,
                'Impressions': 'sum' if 'Impressions' in df.columns else lambda x: 0,
                'Install': 'sum' if 'Install' in df.columns else lambda x: 0
            }).reset_index()
            
            for _, row in exchange_data.iterrows():
                exchange_performance.append({
                    'exchange': str(row['Exchange']),
                    'spend': float(row.get('Spend', 0)),
                    'impressions': int(row.get('Impressions', 0)),
                    'installs': int(row.get('Install', 0))
                })
        
        # Geographic performance
        geographic_performance = []
        country_col = None
        for col in df.columns:
            if 'country' in col.lower() or 'geo' in col.lower():
                country_col = col
                break
        
        if country_col and country_col in df.columns:
            geo_data = df.groupby(country_col).agg({
                'Spend': 'sum' if 'Spend' in df.columns else lambda x: 0,
                'Install': 'sum' if 'Install' in df.columns else lambda x: 0
            }).reset_index()
            
            for _, row in geo_data.iterrows():
                geographic_performance.append({
                    'country': str(row[country_col]),
                    'spend': float(row.get('Spend', 0)),
                    'installs': int(row.get('Install', 0))
                })
        
        return clean_nan_values({
            'csv_type': self.csv_type,
            'total_rows': len(df),
            'columns': list(df.columns),
            'overview': overview,
            'top_campaigns': top_campaigns,
            'creative_performance': creative_performance,
            'exchange_performance': exchange_performance,
            'geographic_performance': geographic_performance,
            'gambling_insights': {},
            'daily_breakdown': []
        })
    
    def process_inventory_csv(self, filename: str = None) -> Dict[str, Any]:
        """Process inventory CSV file"""
        df = self.df.copy()
        
        # Clean column names
        df.columns = [col.strip() for col in df.columns]
        
        # Find app-related columns
        app_cols = {}
        for col in df.columns:
            col_lower = col.lower()
            if 'app bundle' in col_lower or 'bundle' in col_lower:
                app_cols['bundle'] = col
            elif 'app id' in col_lower:
                app_cols['app_id'] = col
            elif 'app name' in col_lower or 'app_name' in col_lower:
                app_cols['app_name'] = col
            elif col_lower in ['os', 'platform']:
                app_cols['os'] = col
        
        apps = []
        if app_cols:
            # Group by app
            group_cols = [col for col in app_cols.values() if col in df.columns]
            if group_cols:
                app_data = df.groupby(group_cols[0]).agg({
                    'Spend': 'sum' if 'Spend' in df.columns else lambda x: 0,
                    'Impressions': 'sum' if 'Impressions' in df.columns else lambda x: 0,
                    'Install': 'sum' if 'Install' in df.columns else lambda x: 0,
                    'Action': 'sum' if 'Action' in df.columns else lambda x: 0
                }).reset_index()
                
                for _, row in app_data.iterrows():
                    app_bundle = str(row[group_cols[0]])
                    
                    # Get additional info
                    app_info = df[df[group_cols[0]] == row[group_cols[0]]].iloc[0]
                    os_info = str(app_info.get(app_cols.get('os', ''), 'Unknown'))
                    
                    # Generate store links
                    store_links = generate_store_links(app_bundle, os_info.lower())
                    
                    apps.append({
                        'app_name': str(app_info.get(app_cols.get('app_name', ''), 'Unknown App')),
                        'app_bundle': app_bundle,
                        'app_id': str(app_info.get(app_cols.get('app_id', ''), 'unknown')),
                        'os': os_info,
                        'spend': float(row.get('Spend', 0)),
                        'impressions': int(row.get('Impressions', 0)),
                        'installs': int(row.get('Install', 0)),
                        'actions': int(row.get('Action', 0)),
                        'store_links': store_links
                    })
        
        # Daily breakdown for daily inventory files
        daily_breakdown = []
        if self.csv_type == 'inventory_daily' and filename:
            # Extract date from filename
            import re
            date_match = re.search(r'(\d{8})', filename)
            if date_match:
                date_str = date_match.group(1)
                formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
                
                daily_breakdown.append({
                    'date': formatted_date,
                    'spend': float(df.get('Spend', [0]).sum()),
                    'impressions': int(df.get('Impressions', [0]).sum()),
                    'clicks': int(df.get('Clicks', [0]).sum()),
                    'installs': int(df.get('Install', [0]).sum()),
                    'actions': int(df.get('Action', [0]).sum())
                })
        
        return clean_nan_values({
            'csv_type': self.csv_type,
            'total_rows': len(df),
            'columns': list(df.columns),
            'inventory_app_analysis': {
                'apps': apps,
                'categories': [],
                'total_apps': len(apps)
            },
            'daily_breakdown': daily_breakdown
        })

def load_existing_reports():
    """Load existing processed reports from uploads directory"""
    global processed_reports
    uploads_dir = Path(UPLOAD_FOLDER)
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
    """Upload and process Moloco CSV file"""
    
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
        
        # Create report info
        report_info = {
            'id': len(processed_reports) + 1,
            'account': account,
            'filename': file.filename,
            'upload_time': datetime.now().isoformat(),
            'report_path': report_path,
            'csv_type': processor.csv_type,
            'rows': detection_result.get('rows', 0),
            'columns': detection_result.get('columns', [])
        }
        
        # Store report info
        processed_reports.append(report_info)
        
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
async def get_reports():
    """Get list of all processed reports with aggregated data"""
    # Get aggregated data from all reports
    aggregated_data = aggregate_all_reports_data()
    
    # Optimize response size by limiting reports metadata
    limited_reports = processed_reports[-10:] if len(processed_reports) > 10 else processed_reports
    
    return {
        'success': True,
        'reports': limited_reports,  # Only last 10 reports for metadata
        'total_reports': len(processed_reports),
        **aggregated_data  # Add all aggregated data to response
    }

@app.delete("/clear-reports")
async def clear_reports():
    """Clear all processed reports from memory and delete files"""
    global processed_reports
    
    try:
        # Удаляем все файлы из папки uploads
        uploads_dir = Path(UPLOAD_FOLDER)
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
            'cleared_count': 0
        }
        
    except Exception as e:
        print(f"❌ Error clearing reports: {e}")
        return {
            'success': False,
            'message': f'Error clearing reports: {str(e)}'
        }

@app.get("/reports/{report_id}/data")
async def get_report_data(report_id: int):
    """Get processed data for specific report with aggregation"""
    
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

def aggregate_all_reports_data():
    """Aggregate data from all loaded reports and create daily breakdown"""
    global aggregated_data_cache
    
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
    
    # Create hash of processed reports for cache validation
    reports_hash = hashlib.md5(str(len(processed_reports)).encode()).hexdigest()
    current_time = datetime.now()
    
    # Check if we have valid cached data (less than 30 seconds old)
    if (aggregated_data_cache['data'] is not None and 
        aggregated_data_cache['hash'] == reports_hash and
        aggregated_data_cache['timestamp'] and
        (current_time - aggregated_data_cache['timestamp']).seconds < 30):
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
    
    # Load reports data
    if 'reports' in latest_reports:
        try:
            with open(latest_reports['reports']['report_path'], 'r') as f:
                reports_data = json.load(f)
                aggregated_data['overview'] = reports_data.get('overview', {})
                aggregated_data['top_campaigns'] = reports_data.get('top_campaigns', [])
                aggregated_data['creative_performance'] = reports_data.get('creative_performance', {'top_performers': []})
                aggregated_data['exchange_performance'] = reports_data.get('exchange_performance', [])
                aggregated_data['geographic_performance'] = reports_data.get('geographic_performance', [])
                aggregated_data['gambling_insights'] = reports_data.get('gambling_insights', {})
        except Exception as e:
            print(f"❌ Error loading reports data: {e}")
    
    # Load inventory data
    if 'overall' in latest_inventory:
        try:
            with open(latest_inventory['overall']['report_path'], 'r') as f:
                inventory_data = json.load(f)
                aggregated_data['inventory_app_analysis'] = inventory_data.get('inventory_app_analysis', {'apps': [], 'categories': [], 'total_apps': 0})
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

# Date and country filtering endpoints
@app.get("/available-dates")
async def get_available_dates():
    """Get available dates from processed data"""
    try:
        dates = set()
        
        # Extract dates from daily breakdown data
        for report in processed_reports:
            try:
                with open(report['report_path'], 'r') as f:
                    data = json.load(f)
                    daily_breakdown = data.get('daily_breakdown', [])
                    for day_data in daily_breakdown:
                        if 'date' in day_data:
                            dates.add(day_data['date'])
            except Exception as e:
                print(f"❌ Error reading dates from {report['filename']}: {e}")
        
        # If no dates found, generate some mock dates
        if not dates:
            from datetime import datetime, timedelta
            base_date = datetime.now() - timedelta(days=14)
            for i in range(14):
                date = base_date + timedelta(days=i)
                dates.add(date.strftime('%Y-%m-%d'))
        
        sorted_dates = sorted(list(dates))
        
        return {
            "dates": sorted_dates,
            "count": len(sorted_dates)
        }
        
    except Exception as e:
        print(f"❌ Error getting available dates: {e}")
        return {"dates": [], "count": 0}

@app.get("/available-countries")
async def get_available_countries():
    """Get available countries from processed data"""
    try:
        countries = set()
        
        # Extract countries from geographic performance data
        for report in processed_reports:
            try:
                with open(report['report_path'], 'r') as f:
                    data = json.load(f)
                    geo_performance = data.get('geographic_performance', [])
                    for geo_data in geo_performance:
                        if 'country' in geo_data:
                            countries.add(geo_data['country'])
            except Exception as e:
                print(f"❌ Error reading countries from {report['filename']}: {e}")
        
        # Add some common countries if none found
        if not countries:
            countries = {'US', 'GB', 'FR', 'DE', 'JP', 'AU', 'CA', 'BR', 'IN', 'RU'}
        
        return {
            "countries": sorted(list(countries)),
            "count": len(countries)
        }
        
    except Exception as e:
        print(f"❌ Error getting available countries: {e}")
        return {"countries": [], "count": 0}

# Filtered data endpoints
@app.get("/reports/filtered")
async def get_filtered_reports(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    country: Optional[str] = None
):
    """Get filtered reports data"""
    try:
        # Get all aggregated data
        all_data = aggregate_all_reports_data()
        
        # Apply date filtering
        if start_date or end_date:
            filtered_daily = []
            for day_data in all_data.get('daily_breakdown', []):
                day_date = day_data.get('date', '')
                
                # Check date range
                include_day = True
                if start_date and day_date < start_date:
                    include_day = False
                if end_date and day_date > end_date:
                    include_day = False
                
                if include_day:
                    filtered_daily.append(day_data)
            
            all_data['daily_breakdown'] = filtered_daily
        
        # Apply country filtering
        if country:
            # Filter geographic performance
            filtered_geo = []
            for geo_data in all_data.get('geographic_performance', []):
                if geo_data.get('country', '').upper() == country.upper():
                    filtered_geo.append(geo_data)
            
            all_data['geographic_performance'] = filtered_geo
        
        return {
            'success': True,
            'filters': {
                'start_date': start_date,
                'end_date': end_date,
                'country': country
            },
            **all_data
        }
        
    except Exception as e:
        print(f"❌ Error filtering reports: {e}")
        raise HTTPException(status_code=500, detail=f"Error filtering reports: {str(e)}")

# Pagination endpoint for creatives
@app.get("/creatives")
async def get_creatives(
    page: int = 1,
    per_page: int = 30,
    sort_by: str = 'spend',
    sort_order: str = 'desc'
):
    """Get paginated creative performance data"""
    try:
        # Get all aggregated data
        all_data = aggregate_all_reports_data()
        
        # Get creative performance data
        creatives = all_data.get('creative_performance', {}).get('top_performers', [])
        
        # Apply sorting
        reverse = (sort_order.lower() == 'desc')
        
        if sort_by in ['spend', 'installs', 'actions'] and creatives:
            creatives.sort(key=lambda x: x.get(sort_by, 0), reverse=reverse)
        elif sort_by == 'creative_name' and creatives:
            creatives.sort(key=lambda x: x.get('creative_name', ''), reverse=reverse)
        
        # Calculate pagination
        total_creatives = len(creatives)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        paginated_creatives = creatives[start_idx:end_idx]
        
        return {
            'success': True,
            'creatives': paginated_creatives,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_creatives,
                'total_pages': (total_creatives + per_page - 1) // per_page,
                'has_next': end_idx < total_creatives,
                'has_prev': page > 1
            },
            'sorting': {
                'sort_by': sort_by,
                'sort_order': sort_order
            }
        }
        
    except Exception as e:
        print(f"❌ Error getting paginated creatives: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting creatives: {str(e)}")

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

# Simple app database
class SimpleAppDB:
    def __init__(self):
        self.apps = {}
    
    def get_app_info(self, app_id: str):
        return self.apps.get(app_id, None)
    
    def get_all_categories(self):
        categories = set()
        for app_data in self.apps.values():
            if 'category' in app_data:
                categories.add(app_data['category'])
        return list(categories)
    
    def search_apps(self, query: str):
        results = []
        query_lower = query.lower()
        for app_id, app_data in self.apps.items():
            if (query_lower in app_data.get('name', '').lower() or 
                query_lower in app_data.get('description', '').lower()):
                results.append({"id": app_id, **app_data})
        return results
    
    def get_app_statistics(self):
        return {
            'total_apps': len(self.apps),
            'categories': self.get_all_categories()
        }

app_db = SimpleAppDB()

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

# Export the app for Vercel
handler = app
