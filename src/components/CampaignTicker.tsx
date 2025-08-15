import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CampaignTickerProps {
  campaign: string;
  performance?: string;
  className?: string;
}

const CampaignTicker: React.FC<CampaignTickerProps> = ({ 
  campaign, 
  performance = '',
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Создаем сокращенную версию названия кампании
  const getShortCampaign = (fullCampaign: string) => {
    if (fullCampaign.length <= 20) return fullCampaign;
    
    // Берем первые 15 символов и добавляем многоточие
    return fullCampaign.substring(0, 15) + '...';
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    if (isExpanded) {
      e.stopPropagation();
      setIsExpanded(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md px-2 py-1 transition-colors"
        onClick={handleToggle}
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
        )}
        
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
          {isExpanded ? campaign : getShortCampaign(campaign)}
        </span>
      </div>

      {/* Overlay для закрытия при клике вне области */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={handleClickOutside}
        />
      )}

      {/* Развернутое содержимое */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-20 min-w-64 max-w-80">
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Campaign Name:</p>
              <p className="text-sm text-gray-900 dark:text-white break-words">
                {campaign}
              </p>
            </div>
            
            {performance && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Performance:</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  performance === 'High' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : performance === 'Medium'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : performance === 'Low'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {performance}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignTicker;
