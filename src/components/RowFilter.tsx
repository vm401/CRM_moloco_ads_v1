import React, { memo, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

interface RowFilterProps {
  totalRows: number;
  currentLimit: number;
  onLimitChange: (limit: number) => void;
}

const RowFilter: React.FC<RowFilterProps> = memo(({ totalRows, currentLimit, onLimitChange }) => {
  const limits = useMemo(() => [10, 25, 50, 100], []);
  
  const options = useMemo(() => {
    const baseOptions = limits.map(limit => ({
      value: limit,
      label: `1-${limit} ${totalRows > limit ? `(из ${totalRows})` : ''}`
    }));
    
    if (totalRows > 100) {
      baseOptions.push({
        value: totalRows,
        label: `ВСЕ (${totalRows})`
      });
    }
    
    return baseOptions;
  }, [limits, totalRows]);
  
  return (
    <div className="flex items-center gap-4 mb-4">
      <span className="text-sm font-mono text-muted-foreground">ПОКАЗАТЬ СТРОК:</span>
      
      <div className="relative">
        <select
          value={currentLimit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="appearance-none bg-card border border-red-500/20 text-foreground px-3 py-1 pr-8 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200 hover:border-red-500/40"
        >
          {options.map(option => (
            <option key={option.value} value={option.value} className="bg-card text-foreground">
              {option.label}
            </option>
          ))}
        </select>
        
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500 pointer-events-none" />
      </div>
      
      <span className="text-xs font-mono text-muted-foreground">
        {Math.min(currentLimit, totalRows)} из {totalRows}
      </span>
    </div>
  );
});

RowFilter.displayName = 'RowFilter';

export default RowFilter;