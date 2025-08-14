import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "./DateRangeFilter.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ 
  onDateRangeChange, 
  className = "" 
}) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Fetch available dates from backend
  useEffect(() => {
    const fetchDates = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.PROD 
          ? 'https://moloco-crm-backend.onrender.com' 
          : 'http://localhost:8000';
          
        const response = await fetch(`${baseUrl}/available-dates`);
        const data = await response.json();
        
        if (data.dates && data.dates.length > 0) {
          // Convert string dates to Date objects
          const dates = data.dates.map((dateStr: string) => {
            try {
              return new Date(dateStr);
            } catch {
              return null;
            }
          }).filter(Boolean);
          
          setAvailableDates(dates);
          console.log(`📅 Found ${dates.length} available dates for calendar`);
        }
      } catch (error) {
        console.error('Error fetching dates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, []);

  // Handle click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle date range change
  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    
    // Call parent callback
    onDateRangeChange(start, end);
  };

  // Check if date is available (has data)
  const isDateAvailable = (date: Date) => {
    return availableDates.some(availableDate => 
      availableDate.toDateString() === date.toDateString()
    );
  };

  // Custom day className function
  const getDayClassName = (date: Date) => {
    const baseClass = "react-datepicker__day";
    
    if (!isDateAvailable(date)) {
      return `${baseClass} react-datepicker__day--disabled opacity-30`;
    }
    
    return baseClass;
  };

  // Filter available dates only
  const filterDate = (date: Date) => {
    return isDateAvailable(date);
  };

  // Quick date range presets
  const setQuickRange = (days: number) => {
    if (availableDates.length === 0) return;
    
    const sortedDates = [...availableDates].sort((a, b) => b.getTime() - a.getTime());
    const end = sortedDates[0]; // Most recent date
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    
    // Find actual start date in available dates
    const actualStart = availableDates
      .filter(d => d >= start && d <= end)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    
    if (actualStart) {
      setStartDate(actualStart);
      setEndDate(end);
      onDateRangeChange(actualStart, end);
    }
  };

  const clearFilter = () => {
    setStartDate(null);
    setEndDate(null);
    onDateRangeChange(null, null);
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return "Все даты";
    if (startDate && !endDate) return startDate.toLocaleDateString('ru-RU');
    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        return startDate.toLocaleDateString('ru-RU');
      }
      return `${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`;
    }
    return "Выберите даты";
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-500">📅</span>
        <div className="w-40 h-8 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return null; // Don't show filter if no dates available
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Период:</span>
        
        <Button
          variant="outline"
          onClick={() => setShowCalendar(!showCalendar)}
          className="min-w-[200px] justify-start text-left font-normal border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
        >
          {formatDateRange()}
        </Button>
        
        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="h-8 w-8 p-0"
            title="Сбросить фильтр"
          >
            ✕
          </Button>
        )}
      </div>

      {showCalendar && (
        <Card ref={calendarRef} className="absolute top-full left-0 mt-2 z-50 shadow-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            {/* Single simplified calendar */}
            <div>
              <DatePicker
                selected={startDate}
                onChange={handleDateChange}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                inline
                monthsShown={1}
                filterDate={filterDate}
                dayClassName={getDayClassName}
                calendarClassName="!border-0"
                showPopperArrow={false}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
