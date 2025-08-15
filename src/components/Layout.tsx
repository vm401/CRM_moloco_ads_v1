import React, { useState } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`
        transition-all duration-300
        ${sidebarCollapsed ? 'ml-16' : 'ml-64'}
      `}>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
