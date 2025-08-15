"""
Simplified FastAPI Backend for Moloco Dashboard - Vercel Compatible
"""
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import io
from datetime import datetime
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np

# Initialize FastAPI app
app = FastAPI(
    title="Moloco Dashboard API",
    description="API for processing Moloco CSV files and generating analytics",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (for Vercel serverless)
processed_reports = []

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

class SimpleMolocoProcessor:
    def __init__(self):
        self.df = None
        self.csv_type = 'reports'
    
    def process_csv_data(self, csv_content: bytes, filename: str):
        """Process CSV data from bytes"""
        try:
            # Try to read CSV from bytes
            df = pd.read_csv(io.BytesIO(csv_content))
            self.df = df
            
            # Detect CSV type
            columns = [col.lower().strip() for col in df.columns]
            if any('inventory' in col or 'bundle' in col for col in columns):
                self.csv_type = 'inventory_overall'
            else:
                self.csv_type = 'reports'
            
            # Process data
            return self.process_data()
            
        except Exception as e:
            return {'error': str(e)}
    
    def process_data(self):
        """Process the loaded CSV data"""
        if self.df is None:
            return {'error': 'No data loaded'}
        
        df = self.df.copy()
        
        # Basic overview calculations
        overview = {
            'total_spend': float(df.get('Spend', [0]).sum() if 'Spend' in df.columns else 0),
            'total_impressions': int(df.get('Impressions', [0]).sum() if 'Impressions' in df.columns else 0),
            'total_clicks': int(df.get('Clicks', [0]).sum() if 'Clicks' in df.columns else 0),
            'total_installs': int(df.get('Install', [0]).sum() if 'Install' in df.columns else 0),
            'total_actions': int(df.get('Action', [0]).sum() if 'Action' in df.columns else 0),
        }
        
        # Creative performance
        creative_performance = {'top_performers': []}
        creative_col = None
        for col in df.columns:
            if 'creative' in col.lower() or 'filename' in col.lower():
                creative_col = col
                break
        
        if creative_col and creative_col in df.columns:
            for _, row in df.iterrows():
                creative_performance['top_performers'].append({
                    'creative_name': str(row.get(creative_col, 'Unknown')),
                    'spend': float(row.get('Spend', 0)),
                    'installs': int(row.get('Install', 0)),
                    'actions': int(row.get('Action', 0)),
                    'impressions': int(row.get('Impressions', 0)),
                    'clicks': int(row.get('Clicks', 0))
                })
        
        # Top campaigns
        top_campaigns = []
        campaign_col = None
        for col in df.columns:
            if 'campaign' in col.lower():
                campaign_col = col
                break
        
        if campaign_col and campaign_col in df.columns:
            campaign_data = df.groupby(campaign_col).agg({
                'Spend': 'sum' if 'Spend' in df.columns else lambda x: 0,
                'Install': 'sum' if 'Install' in df.columns else lambda x: 0,
            }).reset_index()
            
            for _, row in campaign_data.head(10).iterrows():
                top_campaigns.append({
                    'campaign': str(row[campaign_col]),
                    'spend': float(row.get('Spend', 0)),
                    'installs': int(row.get('Install', 0))
                })
        
        # Exchange performance
        exchange_performance = []
        if 'Exchange' in df.columns:
            for exchange in df['Exchange'].unique():
                exchange_data = df[df['Exchange'] == exchange]
                exchange_performance.append({
                    'exchange': str(exchange),
                    'spend': float(exchange_data.get('Spend', [0]).sum()),
                    'installs': int(exchange_data.get('Install', [0]).sum())
                })
        
        # Geographic performance
        geographic_performance = []
        country_col = None
        for col in df.columns:
            if 'country' in col.lower():
                country_col = col
                break
        
        if country_col and country_col in df.columns:
            for country in df[country_col].unique():
                country_data = df[df[country_col] == country]
                geographic_performance.append({
                    'country': str(country),
                    'spend': float(country_data.get('Spend', [0]).sum()),
                    'installs': int(country_data.get('Install', [0]).sum())
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
            'inventory_app_analysis': {'apps': [], 'categories': [], 'total_apps': 0},
            'daily_breakdown': []
        })

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
    
    if not file.filename or not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        # Read file content
        content = await file.read()
        
        # Process CSV
        processor = SimpleMolocoProcessor()
        processed_data = processor.process_csv_data(content, file.filename)
        
        if 'error' in processed_data:
            raise HTTPException(status_code=400, detail=processed_data['error'])
        
        # Store in memory (simplified for Vercel)
        report_info = {
            'id': len(processed_reports) + 1,
            'account': account,
            'filename': file.filename,
            'upload_time': datetime.now().isoformat(),
            'csv_type': processor.csv_type,
            'data': processed_data
        }
        
        processed_reports.append(report_info)
        
        return {
            "success": True,
            "message": "File uploaded and processed successfully",
            "report_id": report_info['id'],
            "csv_type": processor.csv_type
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/reports")
async def get_reports():
    """Get list of all processed reports with aggregated data"""
    if not processed_reports:
        return {
            'success': True,
            'reports': [],
            'total_reports': 0,
            'overview': {},
            'top_campaigns': [],
            'creative_performance': {'top_performers': []},
            'exchange_performance': [],
            'geographic_performance': [],
            'inventory_app_analysis': {'apps': [], 'categories': [], 'total_apps': 0}
        }
    
    # Get latest report data
    latest_report = processed_reports[-1]
    data = latest_report['data']
    
    return {
        'success': True,
        'reports': processed_reports[-5:],  # Last 5 reports
        'total_reports': len(processed_reports),
        **data
    }

@app.get("/creatives")
async def get_creatives(
    page: int = 1,
    per_page: int = 30,
    sort_by: str = 'spend',
    sort_order: str = 'desc'
):
    """Get paginated creative performance data"""
    if not processed_reports:
        return {
            'success': True,
            'creatives': [],
            'pagination': {
                'page': 1,
                'per_page': per_page,
                'total': 0,
                'total_pages': 1,
                'has_next': False,
                'has_prev': False
            }
        }
    
    # Get latest report data
    latest_report = processed_reports[-1]
    creatives = latest_report['data'].get('creative_performance', {}).get('top_performers', [])
    
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
        }
    }

@app.get("/available-dates")
async def get_available_dates():
    """Get available dates from processed data"""
    # Mock dates for now
    dates = []
    base_date = datetime.now()
    for i in range(14):
        date = base_date.replace(day=i+1).strftime('%Y-%m-%d')
        dates.append(date)
    
    return {
        "dates": dates,
        "count": len(dates)
    }

@app.get("/available-countries")
async def get_available_countries():
    """Get available countries from processed data"""
    countries = ['US', 'GB', 'FR', 'DE', 'JP', 'AU', 'CA', 'BR', 'IN', 'RU']
    
    return {
        "countries": countries,
        "count": len(countries)
    }

@app.delete("/clear-reports")
async def clear_reports():
    """Clear all processed reports from memory"""
    global processed_reports
    
    try:
        cleared_count = len(processed_reports)
        processed_reports.clear()
        
        return {
            'success': True,
            'message': 'All reports cleared successfully',
            'cleared_count': cleared_count
        }
        
    except Exception as e:
        return {
            'success': False,
            'message': f'Error clearing reports: {str(e)}'
        }

# Export the app for Vercel
def handler(request, response):
    return app(request, response)

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)