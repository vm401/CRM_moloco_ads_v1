"""
Moloco CSV Processor - Extracted from main.py for better architecture
"""
import pandas as pd
import numpy as np
import json
from datetime import datetime
from app_database import app_db

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
from typing import Dict, List, Any, Optional
import os

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

def extract_date_from_filename(filename: str) -> str:
    """Extract date from filename for daily breakdown"""
    import re
    date_patterns = [
        r'(\d{4})(\d{2})(\d{2})',  # YYYYMMDD
        r'(\d{2})-(\d{2})-(\d{4})',  # DD-MM-YYYY
        r'(\d{4})-(\d{2})-(\d{2})',  # YYYY-MM-DD
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, filename)
        if match:
            if len(match.groups()) == 3:
                if len(match.group(1)) == 4:  # YYYYMMDD or YYYY-MM-DD
                    return f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
                else:  # DD-MM-YYYY
                    return f"{match.group(3)}-{match.group(2)}-{match.group(1)}"
    
    return datetime.now().strftime('%Y-%m-%d')

class MolocoCSVProcessor:
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.csv_type: Optional[str] = None
        self.processed_data: Dict[str, Any] = {}
        
    def load_and_detect_type(self, filepath: str) -> Dict[str, Any]:
        """Load CSV and detect its type (Reports, Inventory Overall, Inventory Daily)"""
        try:
            self.df = pd.read_csv(filepath)
            
            # Debug: Print columns for analysis
            print(f"🔍 CSV Columns: {list(self.df.columns)}")
            
            # Detect CSV type based on columns
            columns = set(self.df.columns)
            
            # More flexible detection logic
            if 'Campaign' in columns:
                if 'Inventory - App Title' in columns or 'App Title' in columns:
                    self.csv_type = 'inventory_daily'
                elif 'Impressions' in columns and 'Spend' in columns:
                    self.csv_type = 'reports'
                else:
                    # If we have Campaign but not sure, assume reports
                    self.csv_type = 'reports'
            elif 'Inventory - App Title' in columns or 'App Title' in columns:
                if 'D1_ROAS' in columns or 'ROAS' in columns:
                    self.csv_type = 'inventory_overall'
                else:
                    self.csv_type = 'inventory_daily'
            else:
                # Try to guess based on common patterns
                if 'Spend' in columns and 'Install' in columns:
                    self.csv_type = 'reports'
                elif 'App Title' in columns or 'Bundle ID' in columns:
                    self.csv_type = 'inventory_overall'
                else:
                    self.csv_type = 'unknown'
            
            print(f"🎯 Detected CSV type: {self.csv_type}")
                
            return {
                'success': True,
                'type': self.csv_type,
                'rows': len(self.df),
                'columns': list(self.df.columns)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def process_reports_csv(self) -> Dict[str, Any]:
        """Process Reports CSV type"""
        if self.df is None:
            return {'error': 'No data loaded'}
            
        # Basic aggregations
        total_spend = float(self.df['Spend'].sum()) if 'Spend' in self.df.columns else 0
        total_installs = int(self.df['Install'].sum()) if 'Install' in self.df.columns else 0
        # Check for different impression column names
        impression_columns = ['Impressions', 'Impression']
        total_impressions = 0
        for col in impression_columns:
            if col in self.df.columns:
                try:
                    total_impressions = int(self.df[col].sum())
                    print(f"👁️ Found impression column: {col} = {total_impressions}")
                    break
                except (ValueError, TypeError) as e:
                    print(f"⚠️ Error processing impression column {col}: {e}")
                    continue
        
        # Check for different revenue column names
        revenue_columns = ['Revenue', 'D1 Revenue', 'D7 Revenue', 'D30 Revenue', 'Purchase', 'D1 Purchase']
        total_revenue = 0
        revenue_col_found = None
        for col in revenue_columns:
            if col in self.df.columns:
                try:
                    total_revenue = float(self.df[col].sum())
                    revenue_col_found = col
                    print(f"💰 Found revenue column: {col} = {total_revenue}")
                    break
                except (ValueError, TypeError) as e:
                    print(f"⚠️ Error processing revenue column {col}: {e}")
                    continue
        
        # Calculate metrics
        avg_cpi = total_spend / total_installs if total_installs > 0 else 0
        
        # Calculate ROAS
        avg_roas = total_revenue / total_spend if total_spend > 0 else 0
        
        # Safe CTR calculation - use already calculated total_impressions
        total_clicks = int(self.df['Click'].sum()) if 'Click' in self.df.columns else 0
        if total_clicks == 0:
            total_clicks = int(self.df['Clicks'].sum()) if 'Clicks' in self.df.columns else 0
        avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        
        # Calculate total actions
        total_actions = int(self.df['Action'].sum()) if 'Action' in self.df.columns else 0
        if total_actions == 0:
            total_actions = int(self.df['Actions'].sum()) if 'Actions' in self.df.columns else 0
        
        print(f"📊 Metrics: Spend={total_spend}, Impressions={total_impressions}, Clicks={total_clicks}, Installs={total_installs}, Actions={total_actions}")
        
        # Top campaigns - safe aggregation
        agg_dict = {'Spend': 'sum'}
        if 'Install' in self.df.columns:
            agg_dict['Install'] = 'sum'
        if 'Click' in self.df.columns:
            agg_dict['Click'] = 'sum'
        elif 'Clicks' in self.df.columns:
            agg_dict['Clicks'] = 'sum'
        if 'Action' in self.df.columns:
            agg_dict['Action'] = 'sum'
        elif 'Actions' in self.df.columns:
            agg_dict['Actions'] = 'sum'
        # Add impression column if exists
        impression_columns = ['Impressions', 'Impression']
        impression_col_found = None
        for col in impression_columns:
            if col in self.df.columns:
                agg_dict[col] = 'sum'
                impression_col_found = col
                print(f"👁️ Found impression column for aggregation: {col}")
                break
        
        # After aggregation, rename the column to 'Impressions' for consistency
        if impression_col_found:
            print(f"🔄 Will rename {impression_col_found} to 'Impressions' in results")
        
        # Check for revenue columns in campaigns
        for col in revenue_columns:
            if col in self.df.columns:
                agg_dict[col] = 'sum'
                break
            
        campaign_stats = self.df.groupby('Campaign').agg(agg_dict).reset_index()
        
        # Rename columns for consistency
        if impression_col_found and impression_col_found != 'Impressions':
            campaign_stats = campaign_stats.rename(columns={impression_col_found: 'Impressions'})
            print(f"✅ Renamed {impression_col_found} to 'Impressions' in campaign_stats")
        
        # Rename Click to Clicks if exists
        if 'Click' in campaign_stats.columns:
            campaign_stats = campaign_stats.rename(columns={'Click': 'Clicks'})
            print(f"✅ Renamed 'Click' to 'Clicks' in campaign_stats")
        
        # Rename Action to Actions if exists  
        if 'Action' in campaign_stats.columns:
            campaign_stats = campaign_stats.rename(columns={'Action': 'Actions'})
            print(f"✅ Renamed 'Action' to 'Actions' in campaign_stats")
        
        # Safe CPI calculation
        if 'Install' in campaign_stats.columns:
            campaign_stats['CPI'] = campaign_stats['Spend'] / campaign_stats['Install'].replace(0, 1)
            campaign_stats['CPI'] = campaign_stats['CPI'].fillna(0).replace([np.inf, -np.inf], 0)
        else:
            campaign_stats['CPI'] = 0
            
        # Calculate CTR for campaigns
        if 'Clicks' in campaign_stats.columns and 'Impressions' in campaign_stats.columns:
            campaign_stats['CTR'] = (campaign_stats['Clicks'] / campaign_stats['Impressions'] * 100).fillna(0)
            campaign_stats['CTR'] = campaign_stats['CTR'].replace([np.inf, -np.inf], 0)
        else:
            campaign_stats['CTR'] = 0

        # Calculate CPA for campaigns (strict zero when no actions)
        action_col_for_cpa = 'Actions' if 'Actions' in campaign_stats.columns else ('Action' if 'Action' in campaign_stats.columns else None)
        if action_col_for_cpa:
            campaign_stats['CPA'] = np.where(
                campaign_stats[action_col_for_cpa] > 0,
                campaign_stats['Spend'] / campaign_stats[action_col_for_cpa],
                0
            )
            campaign_stats['CPA'] = pd.to_numeric(campaign_stats['CPA'], errors='coerce').fillna(0).replace([np.inf, -np.inf], 0)
        else:
            campaign_stats['CPA'] = 0

        # Calculate ROAS for campaigns
        revenue_col = None
        for col in revenue_columns:
            if col in campaign_stats.columns:
                revenue_col = col
                break
                
        if revenue_col and campaign_stats['Spend'].sum() > 0:
            campaign_stats['ROAS'] = campaign_stats[revenue_col] / campaign_stats['Spend']
            campaign_stats['ROAS'] = campaign_stats['ROAS'].fillna(0).replace([np.inf, -np.inf], 0)
        else:
            campaign_stats['ROAS'] = 0
            
        top_campaigns = campaign_stats.nlargest(10, 'Spend').to_dict('records')
        
        # Creative performance - safe aggregation
        if 'Creative' in self.df.columns:
            print(f"🎨 Processing {self.df['Creative'].nunique()} unique creatives from {len(self.df)} rows")
            creative_agg = {'Spend': 'sum'}
            if 'Install' in self.df.columns:
                creative_agg['Install'] = 'sum'
            if 'Action' in self.df.columns:
                creative_agg['Action'] = 'sum'
            # Add clicks
            if 'Click' in self.df.columns:
                creative_agg['Click'] = 'sum'
            elif 'Clicks' in self.df.columns:
                creative_agg['Clicks'] = 'sum'
            # Add impression column if exists
            impression_columns = ['Impressions', 'Impression']
            impression_col_found = None
            for col in impression_columns:
                if col in self.df.columns:
                    creative_agg[col] = 'sum'
                    impression_col_found = col
                    print(f"👁️ Found impression column for creatives: {col}")
                    break
            if 'Completed View' in self.df.columns:
                creative_agg['Completed View'] = 'sum'
            if '1Q(25%) View' in self.df.columns:
                creative_agg['1Q(25%) View'] = 'sum'
            if '2Q(50%) View' in self.df.columns:
                creative_agg['2Q(50%) View'] = 'sum'
            if '3Q(75%) View' in self.df.columns:
                creative_agg['3Q(75%) View'] = 'sum'
                
            creative_stats = self.df.groupby('Creative').agg(creative_agg).reset_index()
            
            # Check results after grouping
            print(f"🔍 Grouped {creative_stats.shape[0]} creatives successfully")
            
            # Rename impression column to 'Impressions' for consistency
            if impression_col_found and impression_col_found != 'Impressions':
                creative_stats = creative_stats.rename(columns={impression_col_found: 'Impressions'})
                print(f"✅ Renamed {impression_col_found} to 'Impressions' in creative_stats")

            # Normalize clicks column name
            if 'Click' in creative_stats.columns:
                creative_stats = creative_stats.rename(columns={'Click': 'Clicks'})
            
            # Safe filtering and CPI calculation
            if 'Install' in creative_stats.columns:
                creative_stats['CPI'] = creative_stats['Spend'] / creative_stats['Install'].replace(0, 1)
                creative_stats['CPI'] = creative_stats['CPI'].fillna(0).replace([np.inf, -np.inf], 0)
            else:
                creative_stats['CPI'] = 0
                
            # Calculate video completion rate
            if 'Completed View' in creative_stats.columns and 'Impressions' in creative_stats.columns:
                creative_stats['Video_Completion_Rate'] = (creative_stats['Completed View'] / creative_stats['Impressions'] * 100).fillna(0)
            else:
                creative_stats['Video_Completion_Rate'] = 0

            # Calculate CTR for creatives
            if 'Clicks' in creative_stats.columns and 'Impressions' in creative_stats.columns:
                creative_stats['CTR'] = (creative_stats['Clicks'] / creative_stats['Impressions'] * 100).fillna(0)
                creative_stats['CTR'] = creative_stats['CTR'].replace([np.inf, -np.inf], 0)
            else:
                creative_stats['CTR'] = 0

            # Calculate CPA for creatives (strict zero when no actions)
            if 'Action' in creative_stats.columns:
                creative_stats['CPA'] = np.where(
                    creative_stats['Action'] > 0,
                    creative_stats['Spend'] / creative_stats['Action'],
                    0
                )
                creative_stats['CPA'] = pd.to_numeric(creative_stats['CPA'], errors='coerce').fillna(0).replace([np.inf, -np.inf], 0)
            else:
                creative_stats['CPA'] = 0
                
                        # Calculate performance based on revenue per action
            if revenue_col_found and 'Action' in creative_stats.columns:
                try:
                    # Convert revenue column to numeric, handling any non-numeric values
                    creative_stats[revenue_col_found] = pd.to_numeric(creative_stats[revenue_col_found], errors='coerce').fillna(0)
                    creative_stats['Action'] = pd.to_numeric(creative_stats['Action'], errors='coerce').fillna(0)

                    # Check if we have valid data
                    if creative_stats[revenue_col_found].sum() > 0 and creative_stats['Action'].sum() > 0:
                        creative_stats['Revenue_per_Action'] = creative_stats[revenue_col_found] / creative_stats['Action'].replace(0, 1)
                        creative_stats['Revenue_per_Action'] = creative_stats['Revenue_per_Action'].fillna(0).replace([np.inf, -np.inf], 0)
                        print(f"✅ Calculated Revenue_per_Action for {len(creative_stats)} creatives")
                    else:
                        print("⚠️ No valid revenue or action data for Revenue_per_Action calculation")
                        creative_stats['Revenue_per_Action'] = 0
                except Exception as e:
                    print(f"⚠️ Error calculating Revenue_per_Action: {e}")
                    creative_stats['Revenue_per_Action'] = 0
                
                # Performance tiers based on revenue per action
                def get_performance_tier(revenue_per_action):
                    if revenue_per_action >= 130 and revenue_per_action <= 189:
                        return 'Tier 1'
                    elif revenue_per_action >= 70 and revenue_per_action <= 129:
                        return 'Tier 2'
                    elif revenue_per_action >= 20 and revenue_per_action <= 69:
                        return 'Tier 3'
                    else:
                        return 'Low'
                        
                creative_stats['Performance'] = creative_stats['Revenue_per_Action'].apply(get_performance_tier)
            else:
                creative_stats['Performance'] = 'Unknown'
                
            # Final check before returning
            print(f"🔍 Final creative stats: {creative_stats.shape[0]} creatives processed")
            
            # Sort by spend (descending) instead of CPI to get actual top performers
            top_creatives = creative_stats.nlargest(20, 'Spend').to_dict('records')
            print(f"🎯 Selected top 20 creatives by spend (not CPI)")
        else:
            top_creatives = []
        
        # Exchange performance - safe aggregation
        if 'Exchange' in self.df.columns:
            exchange_agg = {'Spend': 'sum'}
            if 'Install' in self.df.columns:
                exchange_agg['Install'] = 'sum'
            # Add impression column if exists
            impression_columns = ['Impressions', 'Impression']
            impression_col_found = None
            for col in impression_columns:
                if col in self.df.columns:
                    exchange_agg[col] = 'sum'
                    impression_col_found = col
                    print(f"👁️ Found impression column for exchanges: {col}")
                    break
            # Add clicks column if exists
            if 'Click' in self.df.columns:
                exchange_agg['Click'] = 'sum'
            elif 'Clicks' in self.df.columns:
                exchange_agg['Clicks'] = 'sum'
            if 'Action' in self.df.columns:
                exchange_agg['Action'] = 'sum'
                
            exchange_stats = self.df.groupby('Exchange').agg(exchange_agg).reset_index()
            
            # Rename impression column to 'Impressions' for consistency
            if impression_col_found and impression_col_found != 'Impressions':
                exchange_stats = exchange_stats.rename(columns={impression_col_found: 'Impressions'})
                print(f"✅ Renamed {impression_col_found} to 'Impressions' in exchange_stats")
            
            # Rename clicks column to 'Clicks' for consistency
            if 'Click' in exchange_stats.columns:
                exchange_stats = exchange_stats.rename(columns={'Click': 'Clicks'})
            elif 'Clicks' not in exchange_stats.columns:
                exchange_stats['Clicks'] = 0
            
            # Safe CPI calculation
            if 'Install' in exchange_stats.columns:
                exchange_stats['CPI'] = exchange_stats['Spend'] / exchange_stats['Install'].replace(0, 1)
                exchange_stats['CPI'] = exchange_stats['CPI'].fillna(0).replace([np.inf, -np.inf], 0)
            else:
                exchange_stats['CPI'] = 0
                
            # Safe CPA calculation (strict zero when no actions)
            if 'Action' in exchange_stats.columns:
                exchange_stats['CPA'] = np.where(
                    exchange_stats['Action'] > 0,
                    exchange_stats['Spend'] / exchange_stats['Action'],
                    0
                )
                exchange_stats['CPA'] = pd.to_numeric(exchange_stats['CPA'], errors='coerce').fillna(0).replace([np.inf, -np.inf], 0)
            else:
                exchange_stats['CPA'] = 0
                
            # Safe IPM calculation (Installs Per Mille)
            if 'Impressions' in exchange_stats.columns:
                exchange_stats['IPM'] = (exchange_stats['Install'] / exchange_stats['Impressions'] * 1000).fillna(0)
                exchange_stats['IPM'] = exchange_stats['IPM'].replace([np.inf, -np.inf], 0)
            else:
                exchange_stats['IPM'] = 0
                
            # Safe CTR calculation
            if 'Clicks' in exchange_stats.columns and 'Impressions' in exchange_stats.columns:
                exchange_stats['CTR'] = (exchange_stats['Clicks'] / exchange_stats['Impressions'] * 100).fillna(0)
                exchange_stats['CTR'] = exchange_stats['CTR'].replace([np.inf, -np.inf], 0)
            else:
                exchange_stats['CTR'] = 0
                
            # Calculate ROAS if revenue data is available
            revenue_col = None
            for col in revenue_columns:
                if col in exchange_stats.columns:
                    revenue_col = col
                    break
                    
            if revenue_col and exchange_stats['Spend'].sum() > 0:
                exchange_stats['ROAS'] = exchange_stats[revenue_col] / exchange_stats['Spend']
                exchange_stats['ROAS'] = exchange_stats['ROAS'].fillna(0).replace([np.inf, -np.inf], 0)
            else:
                exchange_stats['ROAS'] = 0
                
            exchange_performance = exchange_stats.nlargest(15, 'Spend').to_dict('records')
        else:
            exchange_performance = []
        
        # Geographic performance
        if 'Country' in self.df.columns:
            geo_stats = self.df.groupby('Country').agg({
                'Spend': 'sum',
                'Install': 'sum'
            }).reset_index()
            geo_stats['CPI'] = geo_stats['Spend'] / geo_stats['Install'].replace(0, 1)
            geo_stats['CPI'] = geo_stats['CPI'].fillna(0).replace([np.inf, -np.inf], 0)
            
            geo_performance = geo_stats.nlargest(10, 'Spend').to_dict('records')
            
            # Detect game types from campaign names
            campaigns = self.df['Campaign'].str.lower()
            detected_games = []
            
            game_keywords = {
                'chick': 'Chicken',
                'plinko': 'Plinko', 
                'slot': 'Slots',
                'poker': 'Poker',
                'blackjack': 'Blackjack',
                'roulette': 'Roulette',
                'crash': 'Crash'
            }
            
            for keyword, game_name in game_keywords.items():
                if campaigns.str.contains(keyword, na=False).any():
                    detected_games.append(game_name)
            
            gambling_insights = {
                'detected_game_types': detected_games,
                'primary_game_type': detected_games[0] if detected_games else 'Unknown',
                'total_countries': len(geo_stats)
            }
        else:
            geo_performance = []
            gambling_insights = {}
        
        # Clean all data to remove NaN values
        def clean_nan_values(obj):
            if isinstance(obj, dict):
                return {k: clean_nan_values(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_nan_values(item) for item in obj]
            elif isinstance(obj, float) and (pd.isna(obj) or np.isinf(obj)):
                return 0.0
            else:
                return obj
        
        result = {
            'overview': {
                'total_spend': total_spend,
                'total_installs': total_installs,
                'total_impressions': total_impressions,
                'total_actions': total_actions,
                'total_clicks': total_clicks,
                'total_revenue': total_revenue,
                'avg_cpi': avg_cpi,
                'avg_roas': avg_roas,
                'avg_ctr': avg_ctr,
                'total_campaigns': self.df['Campaign'].nunique() if 'Campaign' in self.df.columns else 0
            },
            'top_campaigns': top_campaigns,
            'creative_performance': {
                'top_performers': top_creatives
            },
            'exchange_performance': exchange_performance,
            'geographic_performance': geo_performance,
            'gambling_insights': gambling_insights,
            'daily_breakdown': []  # Will be implemented when we have date data
        }
        
        return clean_nan_values(result)
    
    def process_inventory_csv(self, filename: str = None) -> Dict[str, Any]:
        """Process Inventory CSV types with daily breakdown support"""
        if self.df is None:
            return {'error': 'No data loaded'}
        
        # Calculate overview metrics
        total_spend = self.df['Spend'].sum() if 'Spend' in self.df.columns else 0
        total_installs = self.df['Install'].sum() if 'Install' in self.df.columns else 0
        total_impressions = self.df['Impression'].sum() if 'Impression' in self.df.columns else 0
        total_revenue = self.df['D1 Revenue'].sum() if 'D1 Revenue' in self.df.columns else 0
        
        # Calculate averages
        avg_cpi = total_spend / total_installs if total_installs > 0 else 0
        avg_roas = total_revenue / total_spend if total_spend > 0 else 0
        avg_ctr = (self.df['Click'].sum() / total_impressions * 100) if total_impressions > 0 else 0
        
        # Generate daily breakdown
        daily_breakdown = []
        if filename and self.csv_type == 'inventory_daily':
            # Extract date from filename
            date_str = extract_date_from_filename(filename)
            
            daily_breakdown = [{
                'date': date_str,
                'spend': total_spend,
                'impressions': total_impressions,
                'clicks': self.df['Click'].sum() if 'Click' in self.df.columns else 0,
                'installs': total_installs,
                'actions': self.df['Action'].sum() if 'Action' in self.df.columns else 0,
                'revenue': total_revenue,
                'cpi': avg_cpi,
                'roas': avg_roas,
                'ctr': avg_ctr
            }]
        
        # Clean and prepare data with improved store links
        apps_data = []
        for _, row in self.df.iterrows():
            app_data = row.to_dict()
            
            # Get bundle ID from various possible column names
            bundle_id = None
            platform = None
            
            # Try different bundle ID column names
            bundle_columns = [
                'Inventory - App Bundle', 'App Bundle', 'Bundle ID', 'iOS Bundle ID', 
                'Android Bundle ID', 'Bundle_ID', 'App_Bundle'
            ]
            
            for col in bundle_columns:
                if col in row and not pd.isna(row[col]):
                    bundle_id = str(row[col]).strip()
                    break
            
            # Determine platform
            if 'OS' in row:
                platform = row['OS'].lower() if not pd.isna(row['OS']) else None
            
            # Generate store links
            store_links = generate_store_links(bundle_id, platform)
            app_data['Store_Links'] = store_links
            
            # Add platform info if not present
            if 'OS' not in app_data and platform:
                app_data['OS'] = platform.upper()
            
            apps_data.append(app_data)
        
        # Category analysis - try different column names and create from app titles
        category_columns = ['Category', 'Inventory - App Category', 'App Category', 'App_Category']
        category_column = None
        
        for col in category_columns:
            if col in self.df.columns:
                category_column = col
                print(f"📱 Found category column: {col}")
                break
        
        if category_column:
            category_stats = self.df.groupby(category_column).agg({
                'Spend': 'sum' if 'Spend' in self.df.columns else 'count',
                'Install': 'sum' if 'Install' in self.df.columns else 'count',
                'Action': 'sum' if 'Action' in self.df.columns else 'count'
            }).reset_index()
            category_stats = category_stats.rename(columns={category_column: 'Category'})
            category_stats['count'] = self.df.groupby(category_column).size().reset_index()[0]
            categories = category_stats.to_dict('records')
            print(f"✅ Processed {len(categories)} categories")
        else:
            print("⚠️ No category column found, creating from app titles")
            # Create categories from app titles
            if 'Inventory - App Title' in self.df.columns:
                app_categories = self.df.groupby('Inventory - App Title').agg({
                    'Spend': 'sum' if 'Spend' in self.df.columns else 'count',
                    'Install': 'sum' if 'Install' in self.df.columns else 'count',
                    'Action': 'sum' if 'Action' in self.df.columns else 'count'
                }).reset_index()
                app_categories = app_categories.rename(columns={'Inventory - App Title': 'Category'})
                app_categories['count'] = self.df.groupby('Inventory - App Title').size().reset_index()[0]
                categories = app_categories.to_dict('records')
                print(f"✅ Created {len(categories)} categories from app titles")
            else:
                print("⚠️ No app title column found, creating default")
                categories = [{'Category': 'Unknown', 'Spend': total_spend, 'count': len(apps_data)}]
        
        # Clean all data to remove NaN values
        def clean_nan_values(obj):
            if isinstance(obj, dict):
                return {k: clean_nan_values(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_nan_values(item) for item in obj]
            elif isinstance(obj, float) and (pd.isna(obj) or np.isinf(obj)):
                return 0.0
            else:
                return obj
        
        # Calculate metrics for inventory
        total_actions = int(self.df['Action'].sum()) if 'Action' in self.df.columns else 0
        total_clicks = int(self.df['Click'].sum()) if 'Click' in self.df.columns else 0
        avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        
        result = {
            'overview': {
                'total_spend': total_spend,
                'total_installs': total_installs,
                'total_impressions': total_impressions,
                'total_actions': total_actions,
                'total_clicks': total_clicks,
                'total_revenue': total_revenue,
                'avg_cpi': avg_cpi,
                'avg_roas': avg_roas,
                'avg_ctr': avg_ctr,
                'total_campaigns': self.df['Campaign'].nunique() if 'Campaign' in self.df.columns else 0
            },
            'top_campaigns': [],  # Empty for inventory
            'creative_performance': {
                'top_performers': []  # Empty for inventory
            },
            'exchange_performance': [],  # Empty for inventory
            'geographic_performance': [],  # Empty for inventory
            'gambling_insights': {},  # Empty for inventory
            'daily_breakdown': daily_breakdown,  # Now populated for daily files
            'inventory_app_analysis': {
                'apps': apps_data,
                'categories': categories,
                'total_apps': len(apps_data)
            }
        }
        
        return clean_nan_values(result)
    
    def process_data(self) -> Dict[str, Any]:
        """Main processing method"""
        if self.csv_type == 'reports':
            return self.process_reports_csv()
        elif self.csv_type in ['inventory_overall', 'inventory_daily']:
            return self.process_inventory_csv()
        else:
            return {'error': f'Unknown CSV type: {self.csv_type}'}
    
    def save_processed(self, filepath: str) -> bool:
        """Save processed data to JSON file"""
        try:
            self.processed_data = self.process_data()
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(self.processed_data, f, ensure_ascii=False, indent=2, default=str)
            return True
        except Exception as e:
            print(f"Error saving processed data: {e}")
            return False