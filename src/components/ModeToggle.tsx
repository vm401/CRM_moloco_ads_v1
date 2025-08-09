import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Layers } from 'lucide-react';

export default function ModeToggle() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isApp, setIsApp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Определяем текущий режим на основе роута
  useEffect(() => {
    setIsApp(location.pathname === '/app');
  }, [location.pathname]);

  const switchMode = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Имитация загрузки
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (isApp) {
      // Переключаемся на классический режим
      navigate('/dashboard');
    } else {
      // Переключаемся на app режим
      navigate('/app');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2 text-sm">
        <Layout className="w-4 h-4 text-muted-foreground" />
        <span className="font-roboto text-muted-foreground">Режим</span>
      </div>
      
      <button
        onClick={switchMode}
        disabled={isLoading}
        className={`
          relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20
          ${isApp 
            ? 'bg-primary' 
            : 'bg-muted border border-border'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={isApp ? 'Переключить на классический режим' : 'Переключить на app режим'}
      >
        {/* Ползунок */}
        <div
          className={`
            absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center
            ${isApp 
              ? 'left-6 bg-primary-foreground text-primary' 
              : 'left-0.5 bg-foreground text-background'
            }
          `}
        >
          {isLoading ? (
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          ) : isApp ? (
            <Layers className="w-3 h-3" />
          ) : (
            <Layout className="w-3 h-3" />
          )}
        </div>
      </button>
      
      {/* Подпись режима */}
      <div className="flex items-center gap-1 text-xs">
        <span className={`font-mono transition-colors ${isApp ? 'text-primary' : 'text-muted-foreground'}`}>
          {isLoading ? 'Loading...' : isApp ? 'App' : 'Classic'}
        </span>
      </div>
    </div>
  );
}