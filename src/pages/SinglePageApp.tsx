import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Moon, Sun, Layout, LayoutGrid } from 'lucide-react';
import ModeToggle from '../components/ModeToggle';
import { useNavigate } from 'react-router-dom';

// Импортируем компоненты страниц
import Dashboard from './Dashboard';
import Campaigns from './Campaigns';
import Creatives from './Creatives';
import Exchanges from './Exchanges';
import Inventory from './Inventory';
import Upload from './Upload';

// Компонент анимированной стрелки для перехода между секциями
const ScrollArrow = ({ isVisible, progress, onComplete }: { 
  isVisible: boolean; 
  progress: number; 
  onComplete: () => void;
}) => {
  useEffect(() => {
    if (progress >= 100) {
      onComplete();
    }
  }, [progress, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="relative">
        {/* Круг с прогрессом */}
        <div className="w-16 h-16 rounded-full border-2 border-white/20 bg-card/80 backdrop-blur-sm flex items-center justify-center">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeOpacity="0.3"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
              className="transition-all duration-150 ease-out"
            />
          </svg>
          <ChevronDown 
            className={`absolute w-6 h-6 text-white transition-transform duration-150 ${
              progress > 50 ? 'scale-125' : 'scale-100'
            }`}
          />
        </div>
        
        {/* Эффект "взрыва" при завершении */}
        {progress >= 100 && (
          <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-75"></div>
        )}
      </div>
    </div>
  );
};

// Навигационная панель
const Navigation = ({ activeSection, onNavigate, isLoading }: { 
  activeSection: string; 
  onNavigate: (section: string) => void;
  isLoading: boolean;
}) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  
  const sections = [
    { id: 'dashboard', name: '📊 Dashboard', emoji: '📊' },
    { id: 'campaigns', name: '📈 Campaigns', emoji: '📈' },
    { id: 'creatives', name: '🎨 Creatives', emoji: '🎨' },
    { id: 'exchanges', name: '🔄 Exchanges', emoji: '🔄' },
    { id: 'inventory', name: '📱 Inventory', emoji: '📱' },
    { id: 'upload', name: '📤 Upload', emoji: '📤' },
  ];

  // Проверяем текущую тему
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && true);
    setIsDark(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Переключение темы
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



  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="lz-card px-6 py-3 backdrop-blur-lg bg-card/90">
        <div className="flex items-center gap-4">
          {/* Секции */}
          {sections.map((section, index) => (
            <React.Fragment key={section.id}>
              <button
                onClick={() => onNavigate(section.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <span className="text-lg">{section.emoji}</span>
                <span className="hidden sm:inline">{section.name.replace(/^[^\s]+\s/, '')}</span>
              </button>
              {index < sections.length - 1 && (
                <div className="w-px h-4 bg-border/50"></div>
              )}
            </React.Fragment>
          ))}
          
          {/* Разделитель */}
          <div className="w-px h-6 bg-border"></div>
          
          {/* Переключатель режима */}
          <div className="scale-75">
            <ModeToggle />
          </div>
          
          {/* Переключатель темы */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
            title={isDark ? 'Переключиться на светлую тему' : 'Переключиться на темную тему'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden sm:inline">{isDark ? 'Светлая' : 'Темная'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default function SinglePageApp() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollY = useRef(0);
  const scrollStartTime = useRef(0);

  // Обработчик скролла для определения активной секции и показа стрелки
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const scrollDirection = scrollY > lastScrollY.current ? 'down' : 'up';
          lastScrollY.current = scrollY;

          // Определяем активную секцию
          const sections = ['dashboard', 'campaigns', 'creatives', 'exchanges', 'inventory', 'upload'];
          let currentSection = sections[0];
          
          for (const section of sections) {
            const element = sectionRefs.current[section];
            if (element) {
              const rect = element.getBoundingClientRect();
              // Секция активна если её верх находится в верхней половине экрана
              if (rect.top <= 100 && rect.bottom > 100) {
                currentSection = section;
                break;
              }
            }
          }
          
          if (currentSection !== activeSection) {
            setActiveSection(currentSection);
          }

          // Логика стрелки при скролле вниз
          if (scrollDirection === 'down' && !isScrolling && !isLoading) {
            if (!showScrollArrow) {
              setShowScrollArrow(true);
              scrollStartTime.current = Date.now();
              setScrollProgress(0);
            }
            
            const elapsed = Date.now() - scrollStartTime.current;
            const progress = Math.min((elapsed / 800) * 100, 100); // 800ms для полного заполнения
            setScrollProgress(progress);
            
            clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = setTimeout(() => {
              setShowScrollArrow(false);
              setScrollProgress(0);
            }, 1000);
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    if (!isLoading) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeoutRef.current);
    };
  }, [activeSection, showScrollArrow, isScrolling, isLoading]);

  // Навигация к секции
  const navigateToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      setIsScrolling(true);
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => setIsScrolling(false), 1000);
    }
  };

  // Переход к следующей секции при завершении стрелки
  const handleArrowComplete = () => {
    const sections = ['dashboard', 'campaigns', 'creatives', 'exchanges', 'inventory', 'upload'];
    const currentIndex = sections.indexOf(activeSection);
    const nextIndex = (currentIndex + 1) % sections.length;
    navigateToSection(sections[nextIndex]);
    setShowScrollArrow(false);
    setScrollProgress(0);
  };

  return (
    <div className="min-h-screen lz-bg relative">
      {/* Полноэкранные градиенты */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Основной фоновый градиент */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.01] dark:from-white/[0.03] dark:via-transparent dark:to-white/[0.01]"></div>
        
        {/* Дополнительные акценты для светлой темы */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-purple-500/[0.03] via-pink-500/[0.02] to-transparent dark:from-transparent dark:to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-tl from-pink-500/[0.02] via-purple-500/[0.01] to-transparent dark:from-transparent dark:to-transparent"></div>
        
        {/* Радиальные акценты */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-white/[0.02] to-transparent rounded-full blur-3xl dark:from-white/[0.04] dark:to-transparent"></div>
        <div className="absolute top-2/3 right-1/4 w-[500px] h-[500px] bg-gradient-radial from-white/[0.01] to-transparent rounded-full blur-3xl dark:from-white/[0.03] dark:to-transparent"></div>
        <div className="absolute bottom-1/4 left-1/2 w-[400px] h-[400px] bg-gradient-radial from-white/[0.015] to-transparent rounded-full blur-3xl dark:from-white/[0.02] dark:to-transparent"></div>
        
        {/* Розово-фиолетовые акценты только для светлой темы */}
        <div className="absolute top-0 right-1/3 w-[300px] h-[300px] bg-gradient-radial from-purple-400/[0.05] to-transparent rounded-full blur-3xl dark:from-transparent dark:to-transparent"></div>
        <div className="absolute bottom-1/3 left-1/4 w-[250px] h-[250px] bg-gradient-radial from-pink-400/[0.04] to-transparent rounded-full blur-3xl dark:from-transparent dark:to-transparent"></div>
      </div>
      
      {/* Навигация */}
      <Navigation activeSection={activeSection} onNavigate={navigateToSection} isLoading={isLoading} />
      
      {/* Анимированная стрелка */}
      <ScrollArrow 
        isVisible={showScrollArrow} 
        progress={scrollProgress}
        onComplete={handleArrowComplete}
      />

      {/* Загрузочный оверлей */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Блюр фон */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-lg"></div>
          
          {/* Загрузочный контент */}
          <div className="relative z-10 text-center">
            <div className="lz-card p-8 max-w-sm mx-auto">
              {/* Спиннер */}
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              
              {/* Текст */}
              <h3 className="text-xl font-semibold mb-2 text-foreground">Загружаем классический режим</h3>
              <p className="text-sm text-muted-foreground mb-4">Переключение на старый интерфейс...</p>
              
              {/* Прогресс бар */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full animate-pulse" style={{
                  animation: 'loading-progress 1.5s ease-in-out infinite'
                }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Секции */}
      <div className="pt-20 px-6 max-w-[1600px] mx-auto relative z-10">
        {/* Dashboard */}
        <section 
          id="dashboard" 
          ref={(el) => sectionRefs.current.dashboard = el}
          className="min-h-screen py-8 relative"
        >
          <Dashboard />
        </section>

        {/* Campaigns */}
        <section 
          id="campaigns" 
          ref={(el) => sectionRefs.current.campaigns = el}
          className="min-h-screen py-8 relative"
        >
          <Campaigns />
        </section>

        {/* Creatives */}
        <section 
          id="creatives" 
          ref={(el) => sectionRefs.current.creatives = el}
          className="min-h-screen py-8 relative"
        >
          <Creatives />
        </section>

        {/* Exchanges */}
        <section 
          id="exchanges" 
          ref={(el) => sectionRefs.current.exchanges = el}
          className="min-h-screen py-8 relative"
        >
          <Exchanges />
        </section>

        {/* Inventory */}
        <section 
          id="inventory" 
          ref={(el) => sectionRefs.current.inventory = el}
          className="min-h-screen py-8 relative"
        >
          <Inventory />
        </section>

        {/* Upload */}
        <section 
          id="upload" 
          ref={(el) => sectionRefs.current.upload = el}
          className="min-h-screen py-8 relative"
        >
          <Upload />
        </section>
      </div>
    </div>
  );
}