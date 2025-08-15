import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RowFilter from "@/components/RowFilter";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import CountryFilter from "@/components/CountryFilter";

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

const ALL_COLUMNS = [
  "Exchange", "Spend", "Impressions", "Clicks", "Install", "Action", "CTR", "IPM", "CPI", "CPA", "ROAS"
];

const Exchanges = () => {
  const [data, setData] = useState<ExchangeData>({ exchanges: [], total_exchanges: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>('Spend');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [columnOrder, setColumnOrder] = useState<string[]>(ALL_COLUMNS);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(ALL_COLUMNS));
  
  // Фильтры
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  // Применённые фильтры
  const [appliedDateRange, setAppliedDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  const [appliedCountry, setAppliedCountry] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [appliedDateRange, appliedCountry]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://moloco-crm-backend.onrender.com'
        : 'http://localhost:8000';
      
      const params = new URLSearchParams();
      params.append('_t', Date.now().toString());
      
      if (appliedDateRange.start && appliedDateRange.end) {
        params.append('start_date', appliedDateRange.start.toISOString().split('T')[0]);
        params.append('end_date', appliedDateRange.end.toISOString().split('T')[0]);
      } else if (appliedDateRange.start) {
        params.append('start_date', appliedDateRange.start.toISOString().split('T')[0]);
      }
      
      if (appliedCountry) {
        params.append('country', appliedCountry);
      }
      
      const response = await fetch(`${apiUrl}/reports?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        processExchangeData(result);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    setLoading(true);
    setAppliedDateRange(dateRange);
    setAppliedCountry(selectedCountry);
  };

  const resetFilters = () => {
    setDateRange({ start: null, end: null });
    setSelectedCountry(null);
    setAppliedDateRange({ start: null, end: null });
    setAppliedCountry(null);
  };

  const processExchangeData = (result: any) => {
    const exchanges = result.exchange_performance || [];
    setData({
      exchanges: exchanges,
      total_exchanges: exchanges.length
    });
  };

  const renderCell = (exchange: Exchange, column: string) => {
    const value = exchange[column as keyof Exchange];
    
    if (column === 'Exchange') {
      return <span className="font-medium">{value}</span>;
    }
    
    if (typeof value === 'number') {
      if (column.includes('CTR') || column.includes('Rate')) {
        return `${(value * 100).toFixed(2)}%`;
      }
      if (column === 'Spend' || column.includes('CPI') || column.includes('CPA')) {
        return `$${value.toLocaleString()}`;
      }
      return value.toLocaleString();
    }
    
    return value || 'N/A';
  };

  const filteredAndSortedExchanges = data.exchanges
    .filter(exchange => 
      exchange.Exchange.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortColumn as keyof Exchange];
      const bVal = b[sortColumn as keyof Exchange];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortOrder === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading exchanges data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Exchanges Performance</h1>
      </div>

      {/* Фильтры */}
      <Card className="revenue-card">
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
                placeholder="Search exchanges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="revenue-input"
              />
            </div>
            
            {/* Кнопки управления фильтрами */}
            <div className="flex gap-2 flex-shrink-0">
              <Button 
                onClick={applyFilters}
                className="revenue-button revenue-button-primary"
                disabled={loading}
              >
                {loading ? 'Применяю...' : 'Применить'}
              </Button>
              <Button 
                onClick={resetFilters}
                variant="outline"
                className="revenue-button"
                disabled={loading}
              >
                Сбросить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица */}
      <Card className="revenue-card">
        <CardHeader>
          <CardTitle>Exchange Performance ({filteredAndSortedExchanges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="revenue-table">
            <Table>
              <TableHeader className="revenue-table-header">
                <TableRow>
                  {columnOrder.filter(col => visibleColumns.has(col)).map((column) => (
                    <TableHead key={column} className="revenue-table-header-cell">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (sortColumn === column) {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortColumn(column);
                            setSortOrder('desc');
                          }
                        }}
                        className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                      >
                        {column}
                        {sortColumn === column && (
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
                {filteredAndSortedExchanges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnOrder.length} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {data.exchanges.length === 0 
                          ? "No exchange data available. Upload CSV files first!" 
                          : "No exchanges match your search"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedExchanges.map((exchange, index) => (
                    <TableRow key={index} className="revenue-table-row">
                      {columnOrder.filter(col => visibleColumns.has(col)).map((column) => (
                        <TableCell key={column} className="revenue-table-cell">
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
    </div>
  );
};

export default Exchanges;
