import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Устанавливаем тему при загрузке
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--rc-bg-primary)' }}>
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`
        transition-all duration-300
        ${sidebarCollapsed ? 'ml-20' : 'ml-80'}
      `}>
        <Header title={title} />
        
        <main className="p-6" style={{ backgroundColor: 'var(--rc-bg-primary)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
