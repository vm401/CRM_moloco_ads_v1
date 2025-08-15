import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateFilterProps {
  onDateChange: (date: string | null) => void;
  className?: string;
}

export const DateFilter: React.FC<DateFilterProps> = ({ onDateChange, className = "" }) => {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
          setAvailableDates(data.dates);
          console.log(`📅 Found ${data.count} available dates`);
        }
      } catch (error) {
        console.error('Error fetching dates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, []);

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    
    if (value === "all" || value === "") {
      onDateChange(null);
    } else {
      onDateChange(value);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-500">📅</span>
        <div className="w-32 h-8 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return null; // Don't show filter if no dates available
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600 whitespace-nowrap">📅 Дата:</span>
      <Select value={selectedDate} onValueChange={handleDateChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Все даты" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все даты</SelectItem>
          {availableDates.map((date) => (
            <SelectItem key={date} value={date}>
              {formatDate(date)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedDate && selectedDate !== "all" && (
        <button
          onClick={() => handleDateChange("all")}
          className="text-xs text-gray-500 hover:text-gray-700 ml-1"
          title="Сбросить фильтр"
        >
          ✕
        </button>
      )}
    </div>
  );
};
