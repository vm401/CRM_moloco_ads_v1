import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Apple, Bot, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface AppData {
  app: string;
  app_id: string;
  platform: 'iOS' | 'Android' | 'Unknown';
  spend: number;
  actions: number;
  ipm: number;
  installs: number;
  campaigns: number;
  performance: 'Good' | 'Average' | 'Poor';
}

const Apps: React.FC = () => {
  const [apps, setApps] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpend, setTotalSpend] = useState(0);
  const [totalActions, setTotalActions] = useState(0);
  const [avgIPM, setAvgIPM] = useState(0);

  useEffect(() => {
    fetchAppsData();
  }, []);

  const fetchAppsData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://moloco-crm-backend.onrender.com'
        : 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/reports`);
      if (response.ok) {
        const data = await response.json();
        processAppsData(data);
      }
    } catch (error) {
      console.error('Error fetching apps data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAppsData = (data: any) => {
    // Группируем данные по приложениям
    const appsMap = new Map<string, any>();
    
    if (data.creative_performance?.top_performers) {
      data.creative_performance.top_performers.forEach((creative: any) => {
        const appKey = creative.App || 'Unknown App';
        const appId = creative['App ID'] || 'unknown';
        
        if (!appsMap.has(appKey)) {
          appsMap.set(appKey, {
            app: appKey,
            app_id: appId,
            platform: detectPlatform(appKey, appId),
            spend: 0,
            actions: 0,
            ipm: 0,
            installs: 0,
            campaigns: new Set(),
            creatives: 0
          });
        }
        
        const app = appsMap.get(appKey);
        app.spend += creative.Spend || 0;
        app.actions += creative.Action || 0;
        app.installs += creative.Install || 0;
        app.ipm = creative.IPM || 0;
        if (creative.Campaign) {
          app.campaigns.add(creative.Campaign);
        }
        app.creatives += 1;
      });
    }

    // Преобразуем в массив и добавляем метрики производительности
    const appsArray = Array.from(appsMap.values()).map(app => ({
      ...app,
      campaigns: app.campaigns.size,
      performance: getPerformanceRating(app.actions, app.ipm, app.spend)
    }));

    // Сортируем по spend
    appsArray.sort((a, b) => b.spend - a.spend);

    setApps(appsArray);
    
    // Вычисляем общие метрики
    setTotalSpend(appsArray.reduce((sum, app) => sum + app.spend, 0));
    setTotalActions(appsArray.reduce((sum, app) => sum + app.actions, 0));
    setAvgIPM(appsArray.length > 0 ? appsArray.reduce((sum, app) => sum + app.ipm, 0) / appsArray.length : 0);
  };

  const detectPlatform = (appName: string, appId: string): 'iOS' | 'Android' | 'Unknown' => {
    const name = appName.toLowerCase();
    const id = appId.toLowerCase();
    
    if (name.includes('ios') || id.includes('ios') || id.includes('apple')) {
      return 'iOS';
    } else if (name.includes('android') || id.includes('android') || id.includes('google')) {
      return 'Android';
    }
    return 'Unknown';
  };

  const getPerformanceRating = (actions: number, ipm: number, spend: number): 'Good' | 'Average' | 'Poor' => {
    const actionRate = spend > 0 ? actions / spend : 0;
    
    if (actionRate > 0.1 && ipm > 50) return 'Good';
    if (actionRate > 0.05 && ipm > 20) return 'Average';
    return 'Poor';
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'iOS':
        return <Apple className="w-5 h-5 text-gray-600" />;
      case 'Android':
        return <Bot className="w-5 h-5 text-green-600" />;
      default:
        return <Smartphone className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'Good':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Good</Badge>;
      case 'Average':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Average</Badge>;
      case 'Poor':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Poor</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apps Performance</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading apps data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">{/* Content starts directly */}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="revenue-widget-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold metric-orange">
                ${totalSpend.toLocaleString()}
              </span>
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="revenue-widget-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold metric-green">
                {totalActions.toLocaleString()}
              </span>
              <Activity className="w-4 h-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="revenue-widget-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Average IPM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold metric-purple">
                {avgIPM.toFixed(1)}
              </span>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {apps.map((app, index) => (
          <Card key={`${app.app}-${index}`} className="rounded-2xl border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getPlatformIcon(app.platform)}
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {app.app}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {app.platform} • {app.campaigns} campaigns
                    </p>
                  </div>
                </div>
                {getPerformanceBadge(app.performance)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Spend</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${app.spend.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Actions</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {app.actions.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">IPM</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {app.ipm.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Installs</p>
                  <p className="text-lg font-semibold text-green-600">
                    {app.installs.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  App ID: {app.app_id}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {apps.length === 0 && !loading && (
        <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
          <CardContent className="py-12 text-center">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Apps Data</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload CSV reports to see apps performance metrics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Apps;
