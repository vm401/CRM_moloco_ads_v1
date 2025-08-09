import { useState, useEffect } from "react";

export default function TestApi() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        console.log('🔄 Testing API connection...');
        
        // Тест 1: Получаем список отчетов
        const reportsResponse = await fetch(`${import.meta.env.PROD ? 'https://crm-moloco-ads-v1-production.up.railway.app' : 'http://localhost:8000'}/reports`);
        const reports = await reportsResponse.json();
        console.log('📊 Reports:', reports);
        
        if (reports.success && reports.reports && reports.reports.length > 0) {
          const latestReportId = reports.reports[reports.reports.length - 1].id;
          console.log(`🎯 Latest report ID: ${latestReportId}`);
          
          // Тест 2: Получаем данные последнего отчета
          const dataResponse = await fetch(`${import.meta.env.PROD ? 'https://crm-moloco-ads-v1-production.up.railway.app' : 'http://localhost:8000'}/reports/${latestReportId}/data`);
          const reportData = await dataResponse.json();
          console.log('📈 Report data:', reportData);
          
          if (reportData.success && reportData.data.inventory_app_analysis) {
            const inventoryData = reportData.data.inventory_app_analysis;
            console.log(`✅ Got ${inventoryData.apps?.length || 0} apps from CSV processor`);
            console.log('🔍 First app:', inventoryData.apps?.[0]);
            
            setData({
              reportId: latestReportId,
              totalReports: reports.reports.length,
              totalApps: inventoryData.total_apps || 0,
              appsLoaded: inventoryData.apps?.length || 0,
              firstApp: inventoryData.apps?.[0] || null,
              allKeys: inventoryData.apps?.[0] ? Object.keys(inventoryData.apps[0]) : []
            });
          } else {
            setError('No inventory data in report');
          }
        } else {
          setError('No reports found');
        }
      } catch (err) {
        console.error('💥 API Error:', err);
        setError(`API Error: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-foreground">🔄 Testing API...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">❌ API Test Failed</h1>
        <div className="lz-card border-red-500/20 bg-red-500/5 text-red-600 px-4 py-3">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">✅ API Test Success!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="lz-card p-4">
          <div className="text-2xl font-bold text-foreground">{data?.totalReports || 0}</div>
          <div className="text-sm text-muted-foreground">CSV Reports Processed</div>
        </div>
        
        <div className="lz-card p-4">
          <div className="text-2xl font-bold text-green-500">{data?.reportId || 0}</div>
          <div className="text-sm text-muted-foreground">Latest Report ID</div>
        </div>
        
        <div className="lz-card p-4">
          <div className="text-2xl font-bold text-foreground">{data?.totalApps?.toLocaleString() || 0}</div>
          <div className="text-sm text-muted-foreground">Total Apps in CSV</div>
        </div>
        
        <div className="lz-card p-4">
          <div className="text-2xl font-bold text-green-500">{data?.appsLoaded?.toLocaleString() || 0}</div>
          <div className="text-sm text-muted-foreground">Apps Loaded</div>
        </div>
      </div>

      <div className="lz-card p-4">
        <h3 className="font-bold mb-2 text-foreground">📊 Available CSV Columns ({data?.allKeys?.length || 0}):</h3>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {data?.allKeys?.map((key: string, i: number) => (
            <div key={i} className="bg-muted px-2 py-1 rounded text-xs font-mono text-foreground">
              {key}
            </div>
          ))}
        </div>
      </div>

      <div className="lz-card p-4">
        <h3 className="font-bold mb-2 text-foreground">🎯 First App Sample:</h3>
        <pre className="text-xs bg-muted p-2 rounded overflow-auto text-foreground font-mono">
          {JSON.stringify(data?.firstApp, null, 2)}
        </pre>
      </div>
    </div>
  );
}