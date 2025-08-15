import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Target, 
  Globe, 
  Smartphone,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  Activity,
  Users,
  FileText,
  Upload
} from 'lucide-react';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed = false, 
  onToggle 
}) => {
  const location = useLocation();
  
  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      path: '/',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: Target,
      path: '/campaigns',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      id: 'creatives',
      label: 'Creatives',
      icon: Zap,
      path: '/creatives',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      id: 'apps',
      label: 'Apps',
      icon: Smartphone,
      path: '/apps',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      id: 'exchanges',
      label: 'Exchanges',
      icon: TrendingUp,
      path: '/exchanges',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20'
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: BarChart3,
      path: '/inventory',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      id: 'creative-database',
      label: 'Creative Database',
      icon: Database,
      path: '/creative-database',
      color: 'text-pink-500',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20'
    }
  ];

  const bottomItems = [
    {
      id: 'upload',
      label: 'Upload Reports',
      icon: Upload,
      path: '/upload',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`
      fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
      transition-all duration-300 z-50 flex flex-col
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              CRM Moloco
            </span>
          </div>
        )}
        
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${active 
                    ? `${item.bgColor} ${item.color} shadow-sm` 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <Icon className={`
                  w-5 h-5 flex-shrink-0
                  ${active ? item.color : 'group-hover:scale-110 transition-transform'}
                `} />
                
                {!isCollapsed && (
                  <span className="font-medium text-sm">
                    {item.label}
                  </span>
                )}
                
                {isCollapsed && (
                  <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Menu */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-2">
        <nav className="space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${active 
                    ? `${item.bgColor} ${item.color} shadow-sm` 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <Icon className={`
                  w-5 h-5 flex-shrink-0
                  ${active ? item.color : 'group-hover:scale-110 transition-transform'}
                `} />
                
                {!isCollapsed && (
                  <span className="font-medium text-sm">
                    {item.label}
                  </span>
                )}
                
                {isCollapsed && (
                  <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
