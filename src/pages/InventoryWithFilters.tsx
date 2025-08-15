import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import CountryFilter from "@/components/CountryFilter";

interface InventoryItem {
  App: string;
  'App ID': string;
  OS: string;
  Spend: number;
  Impressions: number;
  Clicks: number;
  Install: number;
  Action: number;
  CTR: number;
  IPM: number;
  CPI: number;
  CPA: number;
}

interface InventoryData {
  inventory: InventoryItem[];
  total_inventory: number;
}

const ALL_COLUMNS = [
  "App", "App ID", "OS", "Spend", "Impressions", "Clicks", "Install", "Action", "CTR", "IPM", "CPI", "CPA"
];

const Inventory = () => {
  const [data, setData] = useState<InventoryData>({ inventory: [], total_inventory: 0 });
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
        processInventoryData(result);
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

  const processInventoryData = (result: any) => {
    // Группируем данные по приложениям из креативов
    const appsMap = new Map<string, any>();
    
    if (result.creative_performance?.top_performers) {
      result.creative_performance.top_performers.forEach((creative: any) => {
        const appKey = `${creative.App || 'Unknown'}_${creative['App ID'] || 'unknown'}`;
        
        if (!appsMap.has(appKey)) {
          appsMap.set(appKey, {
            App: creative.App || 'Unknown App',
            'App ID': creative['App ID'] || 'unknown',
            OS: creative.OS || 'Unknown',
            Spend: 0,
            Impressions: 0,
            Clicks: 0,
            Install: 0,
            Action: 0,
            CTR: 0,
            IPM: 0,
            CPI: 0,
            CPA: 0,
            count: 0
          });
        }
        
        const app = appsMap.get(appKey);
        app.Spend += creative.Spend || 0;
        app.Impressions += creative.Impressions || 0;
        app.Clicks += creative.Clicks || 0;
        app.Install += creative.Install || 0;
        app.Action += creative.Action || 0;
        app.count += 1;
      });
    }

    // Вычисляем средние значения
    const inventory = Array.from(appsMap.values()).map(app => ({
      ...app,
      CTR: app.Impressions > 0 ? (app.Clicks / app.Impressions) : 0,
      IPM: app.Impressions > 0 ? (app.Install / app.Impressions * 1000) : 0,
      CPI: app.Install > 0 ? (app.Spend / app.Install) : 0,
      CPA: app.Action > 0 ? (app.Spend / app.Action) : 0
    }));

    setData({
      inventory: inventory,
      total_inventory: inventory.length
    });
  };

  const getOSIcon = (os: string) => {
    const osLower = os.toLowerCase();
    if (osLower.includes('ios') || osLower.includes('iphone')) {
      return '🍎';
    } else if (osLower.includes('android')) {
      return '🤖';
    }
    return '📱';
  };

  const renderCell = (item: InventoryItem, column: string) => {
    const value = item[column as keyof InventoryItem];
    
    if (column === 'App') {
      return <span className="font-medium">{value}</span>;
    }
    
    if (column === 'OS') {
      return (
        <div className="flex items-center gap-2">
          <span>{getOSIcon(value as string)}</span>
          <span>{value}</span>
        </div>
      );
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

  const filteredAndSortedInventory = data.inventory
    .filter(item => 
      item.App.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item['App ID'].toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortColumn as keyof InventoryItem];
      const bVal = b[sortColumn as keyof InventoryItem];
      
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">App Inventory</h1>
      </div>

      {/* Фильтры */}
      <Card className="revenue-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <DateRangeFilter 
              onDateRangeChange={(start, end) => setDateRange({start, end})}
              className="flex-shrink-0"
            />
            
            <CountryFilter
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
            />
            
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="revenue-input"
              />
            </div>
            
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
          <CardTitle>App Inventory ({filteredAndSortedInventory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="revenue-table">
            <Table>
              <TableHeader className="revenue-table-header">
                <TableRow>
                  {columnOrder.filter(col => visibleColumns.has(col)).map((column) => (
                    <TableHead key={column} className="revenue-table-header-cell sortable">
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
                {filteredAndSortedInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnOrder.length} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {data.inventory.length === 0 
                          ? "No inventory data available. Upload CSV files first!" 
                          : "No apps match your search"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedInventory.map((item, index) => (
                    <TableRow key={index} className="revenue-table-row">
                      {columnOrder.filter(col => visibleColumns.has(col)).map((column) => (
                        <TableCell key={column} className="revenue-table-cell">
                          {renderCell(item, column)}
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

export default Inventory;
