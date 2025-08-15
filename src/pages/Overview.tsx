import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign,
  Users,
  Target,
  Zap,
  BarChart3
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  colorClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  colorClass 
}) => {
  return (
    <Card className="revenue-widget-card fade-in">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20`}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
            </div>
          </div>
          
          {change && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend === 'up' ? 'text-green-600 dark:text-green-400' :
              trend === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-gray-600 dark:text-gray-400'
            }`}>
              {trend === 'up' && <TrendingUp className="w-4 h-4" />}
              {trend === 'down' && <TrendingDown className="w-4 h-4" />}
              {change}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Overview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://moloco-crm-backend.onrender.com'
        : 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/reports`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading overview...</p>
        </div>
      </div>
    );
  }

  const totalSpend = data?.overview?.total_spend || 0;
  const totalActions = data?.overview?.total_actions || 0;
  const totalImpressions = data?.overview?.total_impressions || 0;
  const totalInstalls = data?.overview?.total_installs || 0;
  const campaignsCount = data?.top_campaigns?.length || 0;
  const creativesCount = data?.creative_performance?.top_performers?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Your campaign performance at a glance
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Spend"
          value={`$${totalSpend.toLocaleString()}`}
          change="+12.5%"
          trend="up"
          icon={<DollarSign className="w-5 h-5 text-orange-500" />}
          colorClass="metric-orange"
        />
        
        <MetricCard
          title="Total Actions"
          value={totalActions}
          change="+8.2%"
          trend="up"
          icon={<Target className="w-5 h-5 text-green-500" />}
          colorClass="metric-green"
        />
        
        <MetricCard
          title="Impressions"
          value={totalImpressions}
          change="+15.3%"
          trend="up"
          icon={<Activity className="w-5 h-5 text-purple-500" />}
          colorClass="metric-purple"
        />
        
        <MetricCard
          title="Installs"
          value={totalInstalls}
          change="+5.7%"
          trend="up"
          icon={<Users className="w-5 h-5 text-blue-500" />}
          colorClass="metric-purple"
        />
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaigns Overview */}
        <Card className="revenue-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold metric-purple mb-2">
                  {campaignsCount}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Total campaigns running
                </p>
              </div>
              
              {data?.top_campaigns?.slice(0, 3).map((campaign: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {campaign.Campaign}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {campaign.Install || 0} installs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold metric-orange">
                      ${(campaign.Spend || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Creatives Overview */}
        <Card className="revenue-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              Top Creatives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold metric-green mb-2">
                  {creativesCount}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Active creatives
                </p>
              </div>
              
              {data?.creative_performance?.top_performers?.slice(0, 3).map((creative: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {creative.Creative}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {creative.Clicks || 0} clicks
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold metric-green">
                      ${(creative.Spend || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="revenue-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="revenue-button revenue-button-primary p-4 text-left">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">View Campaigns</h3>
                  <p className="text-sm opacity-80">Manage your campaigns</p>
                </div>
              </div>
            </button>
            
            <button className="revenue-button revenue-button-secondary p-4 text-left">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">View Creatives</h3>
                  <p className="text-sm opacity-80">Analyze performance</p>
                </div>
              </div>
            </button>
            
            <button className="revenue-button revenue-button-success p-4 text-left">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">Upload Reports</h3>
                  <p className="text-sm opacity-80">Add new data</p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
