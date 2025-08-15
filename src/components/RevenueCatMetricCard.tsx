import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';

interface RevenueCatMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  children?: React.ReactNode;
  className?: string;
}

const RevenueCatMetricCard: React.FC<RevenueCatMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  children,
  className = ''
}) => {
  return (
    <Card className={`revenue-metric-card ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium medium-contrast-text">{title}</h3>
          {icon && (
            <div className="text-gray-400">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-2xl font-bold high-contrast-text">
            {value}
          </div>
          
          {subtitle && (
            <div className="text-xs medium-contrast-text">
              {subtitle}
            </div>
          )}
          
          {trendValue && (
            <div className="flex items-center gap-1 text-xs">
              {trend === 'up' && <span className="text-green-500">↗</span>}
              {trend === 'down' && <span className="text-red-500">↘</span>}
              {trend === 'neutral' && <span className="text-gray-400">→</span>}
              <span className={`
                ${trend === 'up' ? 'text-green-500' : 
                  trend === 'down' ? 'text-red-500' : 
                  'text-gray-400'}
              `}>
                {trendValue}
              </span>
            </div>
          )}
          
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueCatMetricCard;
