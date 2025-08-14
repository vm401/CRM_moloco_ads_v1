import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RowFilter from "@/components/RowFilter";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import CountryFilter from "@/components/CountryFilter";

// Полный интерфейс для Creative из CSV
interface Creative {
  Creative: string;
  Spend: number;
  Impressions: number;
  Clicks: number;
  Install: number;
  Action: number;
  CTR: number;
  CPI: number;
  CPA: number;
  "1Q(25%) View": number;
  "2Q(50%) View": number;
  "3Q(75%) View": number;
  "Completed View": number;
  "Video_Completion_Rate": number;
  "Revenue_per_Action": number;
  Performance: string;
}

interface CreativeData {
  creatives: Creative[];
  total_creatives: number;
}

// Геометрический фон
const GeometricBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-white/5 to-white/3 rounded-full blur-3xl"></div>
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-white/2 to-white/1 rounded-full blur-3xl"></div>
  </div>
);

// Основные колонки для отображения
const MAIN_COLUMNS = [
  "Creative",
  "Performance",
  "Spend", 
  "Impressions",
  "Clicks",
  "Install",
  "Action",
  "CTR",
  "CPI",
  "CPA"
];

// Расширенные колонки для видео метрик
const VIDEO_COLUMNS = [
  "1Q(25%) View",
  "2Q(50%) View", 
  "3Q(75%) View",
  "Completed View",
  "Video_Completion_Rate",
  "Revenue_per_Action"
];

export default function Creatives() {
  const [data, setData] = useState<CreativeData>({ creatives: [], total_creatives: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>('Spend');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showVideoMetrics, setShowVideoMetrics] = useState(false);
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  // Drag & Drop состояния
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>([...MAIN_COLUMNS]);
  const [rowLimit, setRowLimit] = useState<number>(25);

  useEffect(() => {
    const fetchData = async () => {
      if (dateRange.start || dateRange.end) {
        console.log(`📅 Filtering data by date range:`, dateRange);
      }
      try {
        console.log('🔄 Fetching creative data from CSV processor...');
        
        // Получаем данные напрямую из /reports (новый API) с принудительным обновлением
        let url = `${import.meta.env.PROD ? 'https://moloco-crm-backend.onrender.com' : 'http://localhost:8000'}/reports?` + Date.now();
        
        // Add date range parameters
        if (dateRange.start && dateRange.end) {
          const startStr = dateRange.start.toISOString().split('T')[0];
          const endStr = dateRange.end.toISOString().split('T')[0];
          url += `&start_date=${encodeURIComponent(startStr)}&end_date=${encodeURIComponent(endStr)}`;
          console.log(`📅 Filtering by date range: ${startStr} to ${endStr}`);
        } else if (dateRange.start) {
          const startStr = dateRange.start.toISOString().split('T')[0];
          url += `&start_date=${encodeURIComponent(startStr)}`;
          console.log(`📅 Filtering from date: ${startStr}`);
        }
        
        // Add country parameter
        if (selectedCountry) {
          url += `&country=${encodeURIComponent(selectedCountry)}`;
          console.log(`🌍 Filtering by country: ${selectedCountry}`);
        }
        
        const reportsResponse = await fetch(url, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        const reports = await reportsResponse.json();
        
        if (reports.success && reports.creative_performance?.top_performers) {
          const creativeData = reports.creative_performance.top_performers;
          console.log(`✅ Loaded ${creativeData?.length || 0} creatives from CSV processor`);
          
          setData({
            creatives: creativeData || [],
            total_creatives: creativeData?.length || 0
          });
        } else {
          console.log('⚠️ No creative data found - CSV not processed yet');
          setData({ creatives: [], total_creatives: 0 });
        }
      } catch (error) {
        console.error('💥 Error fetching processed CSV creative data:', error);
        setData({ creatives: [], total_creatives: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, selectedCountry]); // Перезагружаем данные при смене фильтров

  // Функции форматирования
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatNumber = (value: number) => value.toLocaleString();
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  // Функция рендеринга ячейки
  const renderCell = (creative: Creative, column: string) => {
    const value = (creative as any)[column];
    
    switch (column) {
      case 'Creative':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground" title={value || 'Unknown Creative'}>
                {value || 'Unknown Creative'}
              </div>
            </div>
          </div>
        );
      case 'Performance':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            (value || '').toLowerCase() === 'high' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : (value || '').toLowerCase() === 'medium'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            {value || 'Unknown'}
          </span>
        );
      case 'Spend':
        return <span className="font-semibold text-foreground">{formatCurrency(value || 0)}</span>;
      case 'CTR':
        return (
          <span className={`${(value || 0) > 1 ? 'text-green-600 font-semibold' : ''}`}>
            {formatPercentage(value || 0)}
          </span>
        );
      case 'Impressions':
      case 'Clicks':
        return <span className="text-foreground">{formatNumber(value || 0)}</span>;
      case 'Install':
        return <span className="text-green-600 dark:text-green-400 font-semibold">{formatNumber(value || 0)}</span>;
      case 'Action':
        return <span className="text-blue-600 dark:text-blue-400 font-semibold">{formatNumber(value || 0)}</span>;
      case 'CPI':
      case 'CPA':
        return <span className="text-foreground">{formatCurrency(value || 0)}</span>;
      default:
        return <span className="text-foreground">{value || 'N/A'}</span>;
    }
  };

  // Drag & Drop функции
  const handleDragStart = (e: React.DragEvent, column: string) => {
    setDraggedColumn(column);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumn) return;

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumn);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);

    setColumnOrder(newOrder);
    setDraggedColumn(null);
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

  const filteredAndSortedCreatives = [...data.creatives]
    .filter(creative => {
      // Фильтр по поиску
      return searchQuery === '' || 
        (creative.Creative || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (creative.Performance || '').toLowerCase().includes(searchQuery.toLowerCase());
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

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <GeometricBackground />
        <div className="relative z-10 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading processed CSV creative data...</p>
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
            <h1 className="text-3xl font-mono font-bold tracking-tight">🎨 CREATIVE PERFORMANCE</h1>
            <p className="text-muted-foreground mt-1">
              CSV Processed Creatives: <span className="font-semibold text-primary">{data.total_creatives}</span> total
              {filteredAndSortedCreatives.length !== data.creatives.length && (
                <span> • Showing: <span className="font-semibold text-green-400">{filteredAndSortedCreatives.length}</span></span>
              )}
            </p>
          </div>
        </div>

        {/* Фильтры */}
        <Card className="lz-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              {/* Фильтр по дате */}
              <DateRangeFilter 
                onDateRangeChange={(start, end) => setDateRange({start, end})}
                className="flex-shrink-0"
              />
              
              {/* Фильтр по стране */}
              <CountryFilter
                selectedCountry={selectedCountry}
                onCountryChange={setSelectedCountry}
              />
              
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search creatives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="lz-input"
                />
              </div>
              
              {/* Переключатель видео метрик */}
              <Button
                variant={showVideoMetrics ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowVideoMetrics(!showVideoMetrics)}
                className="lz-ghost"
              >
                {showVideoMetrics ? '📹 Hide Video Metrics' : '🎬 Show Video Metrics'}
              </Button>
            </div>
            <RowFilter
              totalRows={data.creatives.length}
              currentLimit={rowLimit}
              onLimitChange={setRowLimit}
            />
          </CardContent>
        </Card>

        {/* Основная таблица */}
        <Card className="lz-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎨 Creative Performance Analysis
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredAndSortedCreatives.length} creatives)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-auto border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur">
                  <TableRow>
                    {/* Основные колонки */}
                    {columnOrder.map((column) => (
                      <TableHead 
                        key={column} 
                        className="min-w-[120px] border-r border-border/50 last:border-r-0 cursor-move"
                        draggable
                        onDragStart={(e) => handleDragStart(e, column)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column)}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">⋮⋮</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort(column)}
                            className="h-auto p-0 font-medium hover:bg-transparent justify-start flex-1"
                          >
                            {column}
                            {sortBy === column && (
                              <span className="ml-1">
                                {sortOrder === 'desc' ? '↓' : '↑'}
                              </span>
                            )}
                          </Button>
                        </div>
                      </TableHead>
                    ))}
                    
                    {/* Видео метрики (показываем только если включены) */}
                    {showVideoMetrics && VIDEO_COLUMNS.map((column) => (
                      <TableHead key={column} className="min-w-[100px] border-r border-border/50 last:border-r-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort(column)}
                          className="h-auto p-0 font-medium hover:bg-transparent justify-start w-full text-xs"
                        >
                          {column.replace('(', ' (').replace('_', ' ')}
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
                  {filteredAndSortedCreatives.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columnOrder.length + (showVideoMetrics ? VIDEO_COLUMNS.length : 0)} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {data.creatives.length === 0 
                            ? "No CSV creative data processed yet. Upload files first!" 
                            : "No creatives match your search"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedCreatives.map((creative, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 border-b border-border/30">
                        
                        {/* Основные колонки в правильном порядке */}
                        {columnOrder.map((column, colIndex) => (
                          <TableCell 
                            key={column} 
                            className={`lz-cell ${column === 'Creative' || column === 'Performance' ? 'font-medium' : 'text-right font-mono'} border-r border-border/50 last:border-r-0`}
                          >
                            {renderCell(creative, column)}
                          </TableCell>
                        ))}

                        {/* Видео метрики */}
                        {showVideoMetrics && VIDEO_COLUMNS.map((column, extIndex) => {
                          const value = (creative as any)[column];
                          return (
                            <TableCell key={column} className={`lz-cell text-right font-mono text-xs border-r border-border/50 last:border-r-0`}>
                              {typeof value === 'number' 
                                ? (column.includes('Rate') || column.includes('Revenue')
                                   ? column.includes('Revenue') ? formatCurrency(value) : formatPercentage(value)
                                   : formatNumber(value))
                                : (value || 'N/A')}
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
        {data.creatives.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {formatNumber(data.total_creatives)}
                </div>
                <p className="text-xs text-muted-foreground">Total Creatives Processed</p>
              </CardContent>
            </Card>
            
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(filteredAndSortedCreatives.reduce((sum, cr) => sum + (cr.Spend || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total Spend (Filtered)</p>
              </CardContent>
            </Card>
            
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(filteredAndSortedCreatives.reduce((sum, cr) => sum + (cr.Install || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total Installs (Filtered)</p>
              </CardContent>
            </Card>
            
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(filteredAndSortedCreatives.reduce((sum, cr) => sum + (cr.Action || 0), 0))}
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