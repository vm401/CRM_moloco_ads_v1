import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { 
  Sun, 
  Moon, 
  Trash2, 
  TestTube2, 
  Bell,
  Search,
  Settings,
  User
} from 'lucide-react';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [isDark, setIsDark] = useState(false);
  const [reportsCount, setReportsCount] = useState(0);

  useEffect(() => {
    // Проверяем текущую тему
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);

    // Получаем количество отчетов
    fetchReportsCount();
  }, []);

  const fetchReportsCount = async () => {
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://r3cstat.vercel.app/api'
        : 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/reports`);
      if (response.ok) {
        const data = await response.json();
        setReportsCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching reports count:', error);
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const clearReports = async () => {
    if (!confirm(`Очистить все отчеты (${reportsCount})?`)) return;
    
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://r3cstat.vercel.app/api'
        : 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/clear-reports`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setReportsCount(0);
        window.location.reload(); // Перезагружаем страницу
      }
    } catch (error) {
      console.error('Error clearing reports:', error);
    }
  };

  const testAPI = async () => {
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://r3cstat.vercel.app/api'
        : 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/health`);
      const data = await response.json();
      
      alert(`API Status: ${response.ok ? 'OK' : 'Error'}\nResponse: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      alert(`API Error: ${error}`);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
        )}
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Reports count */}
        {reportsCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {reportsCount} reports
            </span>
          </div>
        )}

        {/* Clear Reports */}
        {reportsCount > 0 && (
          <Button
            onClick={clearReports}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear Reports
          </Button>
        )}

        {/* Test API */}
        <Button
          onClick={testAPI}
          variant="outline"
          size="sm"
          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800"
        >
          <TestTube2 className="w-4 h-4 mr-1" />
          Test API
        </Button>

        {/* Theme Toggle */}
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="sm"
          className="w-9 h-9 p-0"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-yellow-500" />
          ) : (
            <Moon className="w-4 h-4 text-gray-600" />
          )}
        </Button>

        {/* Settings */}
        <Button
          variant="outline"
          size="sm"
          className="w-9 h-9 p-0"
        >
          <Settings className="w-4 h-4" />
        </Button>

        {/* User Avatar */}
        <Button
          variant="outline"
          size="sm"
          className="w-9 h-9 p-0 rounded-full"
        >
          <User className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
