import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface DashboardData {
  overview?: {
    total_spend?: number;
    total_installs?: number;
    total_impressions?: number;
    total_revenue?: number;
    avg_ctr?: number;
    avg_cpi?: number;
  };
}

const KPI = ({ label, value, trend }: { label: string; value: string; trend?: number[] }) => (
  <Card className="revenue-widget-card">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      {trend && (
        <div className="mt-2 h-6">
          <MiniChart data={trend} />
        </div>
      )}
    </CardContent>
  </Card>
);

const MiniChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  return (
    <svg className="w-full h-full" viewBox="0 0 100 20">
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#db2777" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="chartGradient-dark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="url(#chartGradient)"
        strokeWidth="1.5"
        className="dark:stroke-[url(#chartGradient-dark)]"
        points={data
          .map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = range > 0 ? 20 - ((value - min) / range) * 15 : 10;
            return `${x},${y}`;
          })
          .join(' ')}
      />
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = range > 0 ? 20 - ((value - min) / range) * 15 : 10;
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="1"
            fill="url(#chartGradient)"
            className="opacity-60 hover:opacity-100"
          />
        );
      })}
    </svg>
  );
};

const GeometricBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-white/2 to-white/1 animate-pulse" />
    <div className="absolute top-1/2 -left-20 w-32 h-32 rounded-full bg-gradient-to-br from-white/2 to-white/1 animate-pulse delay-1000" />
    <div className="absolute bottom-0 right-1/3 w-24 h-24 rounded-full bg-gradient-to-br from-white/1 to-white/1 animate-pulse delay-2000" />
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
                  const reportsResponse = await fetch(`${import.meta.env.PROD ? 'https://moloco-crm-backend.onrender.com' : 'http://localhost:8000'}/reports?` + Date.now(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        const reports = await reportsResponse.json();
        
        if (reports.success) {
          setData({ overview: reports.overview });
        } else {
          // No reports available, show demo data
          setData({
            overview: {
              total_spend: 0,
              total_installs: 0,
              total_impressions: 0,
              total_revenue: 0,
              avg_ctr: 0,
              avg_cpi: 0
            }
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback data for demo
        setData({
          overview: {
            total_spend: 715.18,
            total_installs: 104,
            total_impressions: 37774,
            total_revenue: 9.0,
            avg_ctr: 26.55,
            avg_cpi: 6.87
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value?: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  
  const formatNumber = (value?: number) => 
    new Intl.NumberFormat('en-US').format(value || 0);

  const generateTrend = () => Array.from({ length: 7 }, () => Math.random() * 100);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    );
  }

  const overview = data.overview || {};

  return (
    <div className="space-y-6 relative">
      <GeometricBackground />
      
      <div className="flex items-end justify-between relative z-10 lz-interactive">
        <div>
          <h1 className="text-3xl font-mono font-bold lz-brand tracking-tight animate-lz-float">
            📊 DASHBOARD
          </h1>
          <p className="font-mono text-muted-foreground mt-1 tracking-wide">
            REAL-TIME ANALYTICS AND PERFORMANCE METRICS
            <span className="ml-2 inline-flex items-center gap-1">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-mono text-xs">PROCESSING</span>
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 animate-lz-glow">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-mono text-xs text-green-600">CSV ACTIVE</span>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KPI 
          label="Total Spend" 
          value={formatCurrency(overview.total_spend)} 
          trend={generateTrend()}
        />
        <KPI 
          label="Installs" 
          value={formatNumber(overview.total_installs)} 
          trend={generateTrend()}
        />
        <KPI 
          label="Impressions" 
          value={formatNumber(overview.total_impressions)} 
          trend={generateTrend()}
        />
        <KPI 
          label="Revenue" 
          value={formatCurrency(overview.total_revenue)} 
          trend={generateTrend()}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10">
        <Card className="revenue-card revenue-card-hover anim-enter relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center justify-between">
              Performance Analytics
              <div className="w-3 h-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-pulse"></div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="h-48 rounded-md border border-border/60 bg-muted/10 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">Interactive charts coming soon</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="revenue-card revenue-card-hover anim-enter relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative z-10">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <a href="/upload" className="lz-pill text-center hover:scale-105 transition-transform">
                📊 Upload CSV
              </a>
              <a href="/campaigns" className="lz-pill text-center hover:scale-105 transition-transform">
                🎯 Campaigns
              </a>
              <a href="/creatives" className="lz-pill text-center hover:scale-105 transition-transform">
                🎨 Creatives
              </a>
              <a href="/exchanges" className="lz-pill text-center hover:scale-105 transition-transform">
                🔄 Exchanges
              </a>
            </div>
            <a href="/inventory" className="lz-pill w-full text-center hover:scale-105 transition-transform block">
              📦 View Full Inventory
            </a>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;
