import { useEffect, useState } from 'react';

// Компонент для создания интересной геометрии в стиле LayerZero
export default function LayerZeroGeometry() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Основные геометрические элементы */}
      <div className="absolute inset-0">
        {/* Большие градиентные круги */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-violet-500/30 animate-pulse"
          style={{
            top: '10%',
            left: '80%',
            animationDuration: '2s',
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        />
        
        <div 
          className="absolute w-80 h-80 rounded-full opacity-25 blur-2xl bg-gradient-to-tr from-pink-500/40 via-purple-500/30 to-indigo-500/20 animate-pulse"
          style={{
            bottom: '20%',
            left: '10%',
            animationDuration: '3s',
            animationDelay: '0.5s',
            transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * -0.015}px)`
          }}
        />

        {/* Линейные элементы */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-pulse" 
             style={{ animationDuration: '1.5s' }} />
        
        <div className="absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500/40 to-transparent animate-pulse" 
             style={{ animationDuration: '2.5s', animationDelay: '1s' }} />

        {/* Геометрические фигуры */}
        <div 
          className="absolute w-32 h-32 border border-purple-500/20 rotate-45 animate-spin opacity-30"
          style={{
            top: '30%',
            right: '20%',
            animationDuration: '10s',
            transform: `rotate(45deg) translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
          }}
        />

        <div 
          className="absolute w-24 h-24 border border-pink-500/25 animate-ping opacity-20"
          style={{
            bottom: '40%',
            right: '30%',
            animationDuration: '4s',
          }}
        />

        {/* Точки-частицы */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/40 rounded-full animate-pulse"
            style={{
              top: `${20 + (i * 7)}%`,
              left: `${10 + (i * 6)}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s',
              transform: `translate(${mousePosition.x * (0.005 + i * 0.001)}px, ${mousePosition.y * (0.005 + i * 0.001)}px)`
            }}
          />
        ))}

        {/* Сеточные линии */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 h-full">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="border-r border-purple-500/20 h-full" />
            ))}
          </div>
          <div className="absolute inset-0 grid grid-rows-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border-b border-pink-500/15 w-full" />
            ))}
          </div>
        </div>

        {/* Floating элементы */}
        <div 
          className="absolute w-16 h-16 border-2 border-purple-500/30 rounded-full animate-bounce opacity-40"
          style={{
            top: '60%',
            left: '70%',
            animationDuration: '1.5s',
            animationDelay: '0.5s'
          }}
        />

        <div 
          className="absolute w-8 h-8 bg-gradient-to-br from-purple-500/50 to-pink-500/50 rotate-45 animate-spin opacity-50"
          style={{
            top: '15%',
            left: '25%',
            animationDuration: '7s'
          }}
        />

        {/* Радиальные градиенты для глубины */}
        <div 
          className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/20"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, transparent 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)`
          }}
        />
      </div>

      {/* Интерактивные элементы при движении мыши */}
      <div 
        className="absolute w-64 h-64 rounded-full opacity-5 bg-gradient-to-br from-purple-500 to-pink-500 blur-3xl transition-all duration-300 ease-out"
        style={{
          left: mousePosition.x - 128,
          top: mousePosition.y - 128,
        }}
      />
    </div>
  );
}