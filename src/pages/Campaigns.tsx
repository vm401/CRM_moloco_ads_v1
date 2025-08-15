import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RowFilter from "@/components/RowFilter";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { useDebounce } from "@/hooks/useDebounce";

// Полный интерфейс для Campaign из CSV
interface Campaign {
  Campaign: string;
  Spend: number;
  Impressions: number;
  Clicks: number;
  Install: number;
  Actions: number;
  Purchase: number;
  CTR: number;
  CPI: number;
  CPA: number;
  ROAS: number;
}

interface CampaignData {
  campaigns: Campaign[];
  total_campaigns: number;
}

// Геометрический фон
const GeometricBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-white/3 to-white/1 rounded-full blur-3xl"></div>
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-white/2 to-white/1 rounded-full blur-3xl"></div>
  </div>
);

// Все колонки для отображения
const ALL_COLUMNS = [
  "Campaign",
  "Spend", 
  "Impressions",
  "Clicks",
  "Install",
  "Actions",
  "Purchase",
  "CTR",
  "CPI",
  "CPA",
  "ROAS"
];

export default function Campaigns() {
  const [data, setData] = useState<CampaignData>({ campaigns: [], total_campaigns: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [sortBy, setSortBy] = useState<string>('Spend');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  
  // Drag & Drop состояния
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'Campaign', 'Spend', 'Impressions', 'Clicks', 'Install', 'Actions', 'Purchase', 'CTR', 'CPI', 'CPA', 'ROAS'
  ]);
  
  // Состояние фильтра строк
  const [rowLimit, setRowLimit] = useState<number>(25);

  useEffect(() => {
    // Принудительно завершаем загрузку через 5 секунд
    const forceStopLoading = setTimeout(() => {
      console.log('⏰ Force stopping loading after 5 seconds');
      setLoading(false);
      if (!data.campaigns || data.campaigns.length === 0) {
        setData({ campaigns: [], total_campaigns: 0 });
      }
    }, 5000);

    const fetchData = async () => {
      try {
        console.log('🔄 Fetching campaign data from CSV processor...');
        
        // Получаем данные напрямую из /reports (новый API) с принудительным обновлением
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 секунды таймаут
        
                          const reportsResponse = await fetch(`${import.meta.env.PROD ? 'https://r3cstat.vercel.app/api' : 'http://localhost:8000'}/reports?` + Date.now(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const reports = await reportsResponse.json();
        
        console.log('🔍 API Response:', reports);
        console.log('🔍 reports.success:', reports.success);
        console.log('🔍 reports.top_campaigns:', reports.top_campaigns);
        
        if (reports.success && reports.top_campaigns) {
          const campaignData = reports.top_campaigns;
          console.log(`✅ Loaded ${campaignData?.length || 0} campaigns from CSV processor`);
          
          setData({
            campaigns: campaignData || [],
            total_campaigns: campaignData?.length || 0
          });
        } else {
          console.log('⚠️ No campaign data found - using demo data');
          // Принудительно устанавливаем пустые данные чтобы остановить загрузку
          setData({ 
            campaigns: [], 
            total_campaigns: 0 
          });
        }
      } catch (error) {
        console.error('💥 Error fetching processed CSV campaign data:', error);
        setData({ campaigns: [], total_campaigns: 0 });
      } finally {
        clearTimeout(forceStopLoading);
        setLoading(false);
      }
    };

    fetchData();
    
    return () => {
      clearTimeout(forceStopLoading);
    };
  }, []);

  // Функции форматирования (мемоизированы)
  const formatCurrency = useCallback((value: number) => `$${value.toFixed(2)}`, []);
  const formatNumber = useCallback((value: number) => value.toLocaleString(), []);
  const formatPercentage = useCallback((value: number) => `${value.toFixed(2)}%`, []);

  // Функция рендеринга ячейки
  const renderCell = (campaign: Campaign, column: string) => {
    const value = (campaign as any)[column];
    
    switch (column) {
      case 'Campaign':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground" title={value || 'Unknown Campaign'}>
                {value || 'Unknown Campaign'}
              </div>
            </div>
          </div>
        );
      case 'Spend':
        return <span className="font-semibold text-foreground">{formatCurrency(value || 0)}</span>;
      case 'CTR':
      case 'ROAS':
        return (
          <span className={`${(value || 0) > 100 ? 'text-green-600 font-semibold' : (value || 0) > 50 ? 'text-yellow-600' : 'text-gray-500'}`}>
            {formatPercentage(value || 0)}
          </span>
        );
      case 'Impressions':
      case 'Clicks':
      case 'Purchase':
        return <span className="text-foreground">{formatNumber(value || 0)}</span>;
      case 'Install':
        return <span className="text-green-600 dark:text-green-400 font-semibold">{formatNumber(value || 0)}</span>;
      case 'Actions':
        return <span className="text-blue-600 dark:text-blue-400 font-semibold">{formatNumber(value || 0)}</span>;
      case 'CPI':
      case 'CPA':
        return <span className="text-foreground">{formatCurrency(value || 0)}</span>;
      default:
        return <span className="text-foreground">{value || 'N/A'}</span>;
    }
  };

  // Сортировка и фильтрация
  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  // Drag & Drop функции
  const handleDragStart = useCallback((e: React.DragEvent, column: string) => {
    setDraggedColumn(column);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumn) return;

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumn);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);

    setColumnOrder(newOrder);
    setDraggedColumn(null);
  }, [draggedColumn, columnOrder]);

  const filteredAndSortedCampaigns = useMemo(() => {
    return [...data.campaigns]
      .filter(campaign => {
        // Фильтр по поиску
        return debouncedSearchQuery === '' || 
          (campaign.Campaign || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase());
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
  }, [data.campaigns, debouncedSearchQuery, sortBy, sortOrder, rowLimit]);

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <GeometricBackground />
        <div className="relative z-10 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading processed CSV campaign data...</p>
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
            <h1 className="text-3xl font-mono font-bold tracking-tight">📈 CAMPAIGN PERFORMANCE</h1>
            <p className="text-muted-foreground mt-1">
              CSV Processed Campaigns: <span className="font-semibold text-primary">{data.total_campaigns}</span> total
              {filteredAndSortedCampaigns.length !== data.campaigns.length && (
                <span> • Showing: <span className="font-semibold text-green-400">{filteredAndSortedCampaigns.length}</span></span>
              )}
            </p>
          </div>
        </div>

        {/* Фильтры */}
        <Card className="lz-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="lz-input"
                />
              </div>
            </div>
            <RowFilter
              totalRows={data.campaigns.length}
              currentLimit={rowLimit}
              onLimitChange={setRowLimit}
            />
          </CardContent>
        </Card>

        {/* Основная таблица */}
        <Card className="lz-card">
    <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Campaign Performance Analysis
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredAndSortedCampaigns.length} campaigns)
              </span>
            </CardTitle>
    </CardHeader>
    <CardContent>
            <div className="max-h-[600px] overflow-auto lz-table">
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur lz-table-header">
                  <TableRow>
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
            </TableRow>
          </TableHeader>
          <TableBody>
                  {filteredAndSortedCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columnOrder.length} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {data.campaigns.length === 0 
                            ? "No CSV campaign data processed yet. Upload files first!" 
                            : "No campaigns match your search"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedCampaigns.map((campaign, index) => (
                      <TableRow key={index} className="lz-table-row border-b border-border/30">
                        
                        {columnOrder.map((column, colIndex) => (
                          <TableCell 
                            key={column} 
                            className={`lz-cell ${column === 'Campaign' ? 'font-medium' : 'text-right font-mono'} border-r border-border/50 last:border-r-0`}
                          >
                            {renderCell(campaign, column)}
                          </TableCell>
                        ))}

              </TableRow>
                    ))
                  )}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>

        {/* Статистика */}
        {data.campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {formatNumber(data.total_campaigns)}
                </div>
                <p className="text-xs text-muted-foreground">Total Campaigns Processed</p>
              </CardContent>
            </Card>
            
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(filteredAndSortedCampaigns.reduce((sum, c) => sum + (c.Spend || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total Spend (Filtered)</p>
              </CardContent>
            </Card>
            
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(filteredAndSortedCampaigns.reduce((sum, c) => sum + (c.Install || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total Installs (Filtered)</p>
              </CardContent>
            </Card>
            
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(filteredAndSortedCampaigns.reduce((sum, c) => sum + (c.Actions || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total Actions (Filtered)</p>
              </CardContent>
            </Card>
            
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(filteredAndSortedCampaigns.reduce((sum, c) => sum + (c.Purchase || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total Purchases (Filtered)</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}