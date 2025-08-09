import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RowFilter from "@/components/RowFilter";

// Полный интерфейс со всеми колонками из API
interface InventoryApp {
  "Campaign": string;
  "Campaign ID": string;
  "Campaign Type": string;
  "Countries": string;
  "LAT Target": string;
  "OS": string;
  "Inventory Traffic": string;
  "Inventory - App Bundle": string;
  "Inventory - App Title": string;
  "Impression": number;
  "Click": number;
  "Install": number;
  "Action": number;
  "Conversion": number;
  "Spend": number;
  "CTR": number;
  "IPM": number;
  "CPC": number;
  "CPI": number;
  "CPA": number;
  "Cost per Conversion": number;
  "D1 Purchase": number;
  "D1 Purchaser": number;
  "D1 Revenue": number;
  "D1 Total ROAS": number;
  "D1 Action": number;
  "D1 CPA": number;
  "D1 Retention": number;
  "D3 Purchase": number;
  "D3 Purchaser": number;
  "D3 Revenue": number;
  "D3 Total ROAS": number;
  "D3 Action": number;
  "D3 CPA": number;
  "D3 Retention": number;
  "D7 Purchase": number;
  "D7 Purchaser": number;
  "D7 Revenue": number;
  "D7 Total ROAS": number;
  "D7 Action": number;
  "D7 CPA": number;
  "D7 Retention": number;
  "D30 Purchase": number;
  "D30 Purchaser": number;
  "D30 Revenue": number;
  "D30 Total ROAS": number;
  "D30 Action": number;
  "D30 CPA": number;
  "D30 Retention": number;
  "Currency": string;
  "Store_Links"?: {
    app_store?: string;
    google_play?: string;
  };
}

interface InventoryData {
  apps: InventoryApp[];
  categories: any[];
  total_apps: number;
}

// Геометрический фон
const GeometricBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
  </div>
);

// Основные колонки для отображения
const MAIN_COLUMNS = [
  "Inventory - App Title",
  "OS",
  "Campaign",
  "Countries",
  "Spend",
  "Install", 
  "Action",
  "Impression",
  "Click",
  "CTR",
  "CPI",
  "CPA"
];

// Расширенные колонки для детального анализа CSV
const EXTENDED_COLUMNS = [
  "Campaign Type",
  "LAT Target", 
  "Inventory Traffic",
  "Conversion",
  "IPM",
  "CPC",
  "Cost per Conversion",
  "D1 Purchase",
  "D1 Revenue", 
  "D1 Total ROAS",
  "D1 CPA",
  "D1 Retention",
  "D3 Purchase",
  "D3 Revenue",
  "D3 Total ROAS", 
  "D3 CPA",
  "D3 Retention",
  "D7 Purchase",
  "D7 Revenue",
  "D7 Total ROAS",
  "D7 CPA", 
  "D7 Retention",
  "D30 Purchase",
  "D30 Revenue",
  "D30 Total ROAS",
  "D30 CPA",
  "D30 Retention"
];

export default function Inventory() {
  const [data, setData] = useState<InventoryData>({ apps: [], categories: [], total_apps: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<'all' | 'ios' | 'android'>('all');
  const [sortBy, setSortBy] = useState<string>('Spend');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showExtended, setShowExtended] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>(MAIN_COLUMNS);
  const [rowLimit, setRowLimit] = useState<number>(25);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Fetching inventory data...');
        
        // Получаем список отчетов
        const reportsResponse = await fetch(`${import.meta.env.PROD ? 'https://crm-moloco-ads-v1-production.up.railway.app' : 'http://localhost:8000'}/reports`);
        const reports = await reportsResponse.json();
        
        if (reports.success && reports.reports && reports.reports.length > 0) {
          const latestReportId = reports.reports[reports.reports.length - 1].id;
          console.log(`📊 Latest report ID: ${latestReportId}`);
          
          // Получаем данные отчета
          const dashboardResponse = await fetch(`${import.meta.env.PROD ? 'https://crm-moloco-ads-v1-production.up.railway.app' : 'http://localhost:8000'}/reports/${latestReportId}/data`);
          const dashboardData = await dashboardResponse.json();
          
          if (dashboardData.success && dashboardData.data.inventory_app_analysis) {
            const inventoryData = dashboardData.data.inventory_app_analysis;
            console.log(`✅ Loaded ${inventoryData.apps?.length || 0} apps from CSV processor`);
            
            setData({
              apps: inventoryData.apps || [],
              categories: inventoryData.categories || [],
              total_apps: inventoryData.total_apps || 0
            });
          } else {
            console.error('❌ No inventory data found in processed CSV');
            setData({
              apps: [],
              categories: [],
              total_apps: 0
            });
          }
        } else {
          console.log('⚠️ No reports found - CSV not processed yet');
          setData({
            apps: [],
            categories: [],
            total_apps: 0
          });
        }
      } catch (error) {
        console.error('💥 Error fetching processed CSV data:', error);
        setData({
          apps: [],
          categories: [],
          total_apps: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Функции форматирования
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatNumber = (value: number) => value.toLocaleString();
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  // Drag & Drop функции
  const handleDragStart = (e: React.DragEvent, columnName: string) => {
    setDraggedColumn(columnName);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== targetColumn) {
      const currentOrder = [...columnOrder];
      const draggedIndex = currentOrder.indexOf(draggedColumn);
      const targetIndex = currentOrder.indexOf(targetColumn);
      
      // Переставляем колонки
      currentOrder.splice(draggedIndex, 1);
      currentOrder.splice(targetIndex, 0, draggedColumn);
      
      setColumnOrder(currentOrder);
    }
    setDraggedColumn(null);
  };

  // Функция для рендеринга ячейки
  const renderCell = (app: InventoryApp, column: string) => {
    const value = app[column];
    
    switch (column) {
      case 'Inventory - App Title':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600"></div>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground" title={value || 'Unknown App'}>
                {value || 'Unknown App'}
              </div>
              <div className="text-xs text-muted-foreground">
                {(app.OS || '').toLowerCase() === 'ios' ? (
                  <a 
                    href={`https://apps.apple.com/search?term=${encodeURIComponent(app["Inventory - App Bundle"] || app["Inventory - App Title"] || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:scale-110 transition-transform cursor-pointer inline-block"
                    title="Открыть в App Store"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700 dark:text-gray-300">
                      <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.13997 6.91 8.85997 6.88C10.15 6.86 11.38 7.75 12.1 7.75C12.81 7.75 14.28 6.65 15.87 6.83C16.57 6.85 18.27 7.15 19.29 8.71C19.2 8.76 17.94 9.56 17.96 11.16C17.98 13.08 19.81 13.78 19.83 13.79C19.8 13.84 19.46 15.05 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                    </svg>
                  </a>
                ) : (app.OS || '').toLowerCase() === 'android' ? (
                  <a 
                    href={`https://play.google.com/store/apps/details?id=${app["Inventory - App Bundle"] || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:scale-110 transition-transform cursor-pointer inline-block"
                    title="Открыть в Google Play"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-green-600 dark:text-green-400">
                      <path d="M3.609 1.814L13.792 12.001L3.609 22.186C3.453 22.342 3.263 22.421 3.039 22.421C2.815 22.421 2.625 22.342 2.469 22.186C2.313 22.030 2.234 21.840 2.234 21.616V2.386C2.234 2.162 2.313 1.972 2.469 1.816C2.625 1.660 2.815 1.581 3.039 1.581C3.263 1.581 3.453 1.660 3.609 1.814ZM15.235 10.558L5.234 0.558C5.390 0.402 5.580 0.323 5.804 0.323C6.028 0.323 6.218 0.402 6.374 0.558L16.609 10.793L15.235 10.558ZM16.609 13.209L6.374 23.444C6.218 23.600 6.028 23.679 5.804 23.679C5.580 23.679 5.390 23.600 5.234 23.444L15.235 13.444L16.609 13.209ZM19.609 10.793C20.375 11.559 20.375 12.443 19.609 13.209L17.609 11.209L19.609 10.793Z"/>
                    </svg>
                  </a>
                ) : (
                  <div className="inline-flex items-center justify-center w-4 h-4 bg-gray-400 text-white rounded-sm text-xs font-bold">
                    ?
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'OS':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            (value || '').toLowerCase() === 'ios' 
              ? 'bg-green-500/10 text-green-600 border border-green-500/20'
              : 'bg-green-500/10 text-green-600 border border-green-500/20'
          }`}>
            {value || 'Unknown'}
          </span>
        );
      case 'Store_Links':
        return (
          <div className="flex justify-center">
            <a
              href={getStoreUrl(app)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-green-500 transition-colors"
              title="Open in App Store"
            >
              🏪
            </a>
          </div>
        );
      case 'Spend':
        const spendValue = typeof value === 'number' ? value : parseFloat(value || '0');
        return (
          <span className="font-mono text-sm text-foreground">
            {formatCurrency(spendValue)}
          </span>
        );
      case 'Install':
        const installValue = typeof value === 'number' ? value : parseFloat(value || '0');
        return (
          <span className="font-mono text-sm text-green-600 dark:text-green-400 font-semibold">
            {formatNumber(installValue)}
          </span>
        );
      case 'Action':
        const actionValue = typeof value === 'number' ? value : parseFloat(value || '0');
        return (
          <span className="font-mono text-sm text-blue-600 dark:text-blue-400 font-semibold">
            {formatNumber(actionValue)}
          </span>
        );
      default:
        return <span className="text-foreground">{value || 'N/A'}</span>;
    }
  };

  // Сортировка и фильтрация
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Мемоизированная фильтрация и сортировка
  const filteredAndSortedApps = useMemo(() => {
    return [...data.apps]
      .filter(app => {
        // Фильтр по поиску
        const matchesSearch = searchQuery === '' || 
          (app["Inventory - App Title"] || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        // Фильтр по платформе
        const matchesPlatform = platformFilter === 'all' || 
          (platformFilter === 'ios' && (app.OS || '').toLowerCase() === 'ios') ||
          (platformFilter === 'android' && (app.OS || '').toLowerCase() === 'android');
        
        return matchesSearch && matchesPlatform;
      })
      .sort((a, b) => {
        const aVal = (a as any)[sortBy] || 0;
        const bVal = (b as any)[sortBy] || 0;
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        }
        
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      })
      .slice(0, rowLimit);
  }, [data.apps, searchQuery, platformFilter, sortBy, sortOrder, rowLimit]);

  // Функция получения ссылки на магазин
  const getStoreUrl = (app: InventoryApp) => {
    if (app.Store_Links?.app_store) return app.Store_Links.app_store;
    if (app.Store_Links?.google_play) return app.Store_Links.google_play;
    
    const appTitle = app["Inventory - App Title"] || '';
    if ((app.OS || '').toLowerCase() === 'ios') {
      return `https://apps.apple.com/search?term=${encodeURIComponent(appTitle)}`;
    } else {
      return `https://play.google.com/store/search?q=${encodeURIComponent(appTitle)}`;
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <GeometricBackground />
        <div className="relative z-10 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading processed CSV data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <GeometricBackground />
      <div className="relative z-10 space-y-6">
        
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-mono font-bold tracking-tight">📱 APP INVENTORY</h1>
            <p className="text-muted-foreground mt-1">
              CSV Processed Apps: <span className="font-semibold text-primary">{data.total_apps.toLocaleString()}</span> total
              {filteredAndSortedApps.length !== data.apps.length && (
                <span> • Showing: <span className="font-semibold text-green-400">{filteredAndSortedApps.length.toLocaleString()}</span></span>
              )}
            </p>
          </div>
        </div>

        {/* Фильтры */}
        <Card className="lz-card">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Платформы */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPlatformFilter('all')}
                  className={platformFilter === 'all' 
                    ? "border-red-500 text-foreground hover:bg-red-50 dark:hover:bg-red-950/20" 
                    : "text-foreground hover:bg-accent"
                  }
                >
                  All Platforms
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPlatformFilter('ios')}
                  className={platformFilter === 'ios' 
                    ? "border-red-500 text-foreground hover:bg-red-50 dark:hover:bg-red-950/20" 
                    : "text-foreground hover:bg-accent"
                  }
                >
                  iOS
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPlatformFilter('android')}
                  className={platformFilter === 'android' 
                    ? "border-red-500 text-foreground hover:bg-red-50 dark:hover:bg-red-950/20" 
                    : "text-foreground hover:bg-accent"
                  }
                >
                  Android
                </Button>
              </div>

              {/* Поиск */}
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search apps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dark:bg-background dark:border-border dark:text-foreground dark:placeholder-muted-foreground"
                />
              </div>

              {/* Переключатель расширенных колонок */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExtended(!showExtended)}
                className={showExtended 
                  ? "border-red-500 text-foreground hover:bg-red-50 dark:hover:bg-red-950/20" 
                  : "text-foreground hover:bg-accent"
                }
              >
                {showExtended ? '📊 Hide Extended' : '📈 Show All CSV Columns'}
              </Button>
            </div>
            
            {/* Row Filter */}
            <div className="mt-4">
              <RowFilter
                totalRows={data.apps.length}
                currentLimit={rowLimit}
                onLimitChange={setRowLimit}
              />
            </div>
          </CardContent>
        </Card>

        {/* Основная таблица */}
        <Card className="lz-card">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📱 App Inventory 
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredAndSortedApps.length} apps)
              </span>
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="max-h-[600px] overflow-auto lz-table">
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur lz-table-header">
                  <TableRow>
                    {/* Основные колонки */}
                    {columnOrder.map((column) => (
                      <TableHead 
                        key={column} 
                        className={`min-w-[120px] border-r border-border/50 last:border-r-0 cursor-move ${
                          draggedColumn === column ? 'opacity-50' : ''
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, column)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column)}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort(column)}
                          className="h-auto p-0 font-medium hover:bg-transparent justify-start w-full text-foreground"
                        >
                          <span className="mr-1 text-xs text-muted-foreground">⋮⋮</span>
                          {column.replace('Inventory - ', '')}
                          {sortBy === column && (
                            <span className="ml-1">
                              {sortOrder === 'desc' ? '↓' : '↑'}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                    ))}
                    
                    {/* Расширенные колонки (показываем только если включены) */}
                    {showExtended && EXTENDED_COLUMNS.map((column) => (
                      <TableHead key={column} className="min-w-[100px] border-r border-border/50 last:border-r-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort(column)}
                          className="h-auto p-0 font-medium hover:bg-transparent justify-start w-full text-xs"
                        >
                          {column}
                          {sortBy === column && (
                            <span className="ml-1">
                              {sortOrder === 'desc' ? '↓' : '↑'}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                    ))}

                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredAndSortedApps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={MAIN_COLUMNS.length + (showExtended ? EXTENDED_COLUMNS.length : 0) + 1} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {data.apps.length === 0 
                            ? "No CSV data processed yet. Upload files first!" 
                            : "No apps match your filters"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedApps.map((app, index) => (
                      <TableRow key={index} className="lz-table-row">
                        
                        {/* Рендерим основные колонки в правильном порядке */}
                        {columnOrder.map((column, colIndex) => (
                          <TableCell key={column} className={`lz-cell border-r border-border/50 last:border-r-0`}>
                            {renderCell(app, column)}
                          </TableCell>
                        ))}

                        {/* Расширенные колонки (показываем только если включены) */}
                        {showExtended && EXTENDED_COLUMNS.map((column, extIndex) => {
                          const value = (app as any)[column];
                          return (
                            <TableCell key={column} className={`lz-cell text-right font-mono text-xs border-r border-border/50 last:border-r-0`}>
                              <span className="text-foreground">
                                {typeof value === 'number' 
                                  ? (column.includes('Revenue') || column.includes('CPA') || column.includes('CPC') || column.includes('CPI') || column.includes('Cost')
                                     ? formatCurrency(value)
                                     : column.includes('ROAS') || column.includes('CTR') || column.includes('Retention')
                                     ? formatPercentage(value)
                                     : formatNumber(value))
                                  : (value || 'N/A')}
                              </span>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

        {/* Статистика */}
        {data.apps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {formatNumber(data.total_apps)}
                </div>
                <p className="text-xs text-muted-foreground">Total Apps Processed</p>
              </CardContent>
            </Card>
            
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(filteredAndSortedApps.reduce((sum, app) => sum + (app.Spend || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total Spend (Filtered)</p>
              </CardContent>
            </Card>
            
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(filteredAndSortedApps.reduce((sum, app) => sum + (app.Install || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total Installs (Filtered)</p>
              </CardContent>
            </Card>
            
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(filteredAndSortedApps.reduce((sum, app) => sum + (app.Action || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total Actions (Filtered)</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}