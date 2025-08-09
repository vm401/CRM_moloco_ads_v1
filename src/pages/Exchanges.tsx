import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RowFilter from "@/components/RowFilter";

// Полный интерфейс для Exchange из CSV
interface Exchange {
  Exchange: string;
  Spend: number;
  Impressions: number;
  Clicks: number;
  Install: number;
  Action: number;
  CTR: number;
  IPM: number;
  CPI: number;
  CPA: number;
  ROAS: number;
}

interface ExchangeData {
  exchanges: Exchange[];
  total_exchanges: number;
}

// Геометрический фон
const GeometricBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
  </div>
);

// Все колонки для отображения
const ALL_COLUMNS = [
  "Exchange",
  "Spend", 
  "Impressions",
  "Clicks",
  "Install",
  "Action",
  "CTR",
  "IPM", 
  "CPI",
  "CPA",
  "ROAS"
];

export default function Exchanges() {
  const [data, setData] = useState<ExchangeData>({ exchanges: [], total_exchanges: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>('Spend');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Drag & Drop состояния
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'Exchange', 'Spend', 'Impressions', 'Clicks', 'Install', 'Action', 'CTR', 'IPM', 'CPI', 'CPA', 'ROAS'
  ]);
  const [rowLimit, setRowLimit] = useState<number>(25);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Fetching exchange data from CSV processor...');
        
        // Получаем данные напрямую из /reports (новый API) с принудительным обновлением
                  const reportsResponse = await fetch(`${import.meta.env.PROD ? 'https://moloco-crm-backend.onrender.com' : 'http://localhost:8000'}/reports?` + Date.now(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        const reports = await reportsResponse.json();
        
        if (reports.success && reports.exchange_performance) {
          const exchangeData = reports.exchange_performance;
          console.log(`✅ Loaded ${exchangeData?.length || 0} exchanges from CSV processor`);
          
          setData({
            exchanges: exchangeData || [],
            total_exchanges: exchangeData?.length || 0
          });
        } else {
          console.log('⚠️ No exchange data found - CSV not processed yet');
          setData({ exchanges: [], total_exchanges: 0 });
        }
      } catch (error) {
        console.error('💥 Error fetching processed CSV exchange data:', error);
        setData({ exchanges: [], total_exchanges: 0 });
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

  // Функция рендеринга ячейки
  const renderCell = (exchange: Exchange, column: string) => {
    const value = (exchange as any)[column];
    
    switch (column) {
      case 'Exchange':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground" title={value || 'Unknown Exchange'}>
                {value || 'Unknown Exchange'}
              </div>
            </div>
          </div>
        );
      case 'Spend':
        return <span className="font-semibold text-foreground">{formatCurrency(value || 0)}</span>;
      case 'CTR':
      case 'IPM':
      case 'ROAS':
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

  const filteredAndSortedExchanges = [...data.exchanges]
    .filter(exchange => {
      // Фильтр по поиску
      return searchQuery === '' || 
        (exchange.Exchange || '').toLowerCase().includes(searchQuery.toLowerCase());
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
            <p className="text-muted-foreground">Loading processed CSV exchange data...</p>
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
            <h1 className="text-3xl font-mono font-bold tracking-tight">🔄 EXCHANGE PERFORMANCE</h1>
            <p className="text-muted-foreground mt-1">
              CSV Processed Exchanges: <span className="font-semibold text-primary">{data.total_exchanges}</span> total
              {filteredAndSortedExchanges.length !== data.exchanges.length && (
                <span> • Showing: <span className="font-semibold text-green-400">{filteredAndSortedExchanges.length}</span></span>
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
                  placeholder="Search exchanges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="lz-input"
                />
              </div>
            </div>
            <RowFilter
              totalRows={data.exchanges.length}
              currentLimit={rowLimit}
              onLimitChange={setRowLimit}
            />
          </CardContent>
        </Card>

        {/* Основная таблица */}
        <Card className="lz-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔄 Exchange Performance Analysis
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredAndSortedExchanges.length} exchanges)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-auto border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur">
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
                  {filteredAndSortedExchanges.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columnOrder.length} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {data.exchanges.length === 0 
                            ? "No CSV exchange data processed yet. Upload files first!" 
                            : "No exchanges match your search"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedExchanges.map((exchange, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 border-b border-border/30">
                        
                        {columnOrder.map((column, colIndex) => (
                          <TableCell 
                            key={column} 
                            className={`lz-cell ${column === 'Exchange' ? 'font-medium' : 'text-right font-mono'} border-r border-border/50 last:border-r-0`}
                          >
                            {renderCell(exchange, column)}
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
        {data.exchanges.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {formatNumber(data.total_exchanges)}
                </div>
                <p className="text-xs text-muted-foreground">Total Exchanges Processed</p>
              </CardContent>
            </Card>
            
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(filteredAndSortedExchanges.reduce((sum, ex) => sum + (ex.Spend || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total Spend (Filtered)</p>
              </CardContent>
            </Card>
            
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(filteredAndSortedExchanges.reduce((sum, ex) => sum + (ex.Install || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total Installs (Filtered)</p>
              </CardContent>
            </Card>
            
            <Card className="lz-card">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(filteredAndSortedExchanges.reduce((sum, ex) => sum + (ex.Action || 0), 0))}
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