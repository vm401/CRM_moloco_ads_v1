import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, Database, Gauge, Image as ImageIcon, Layers3, UploadCloud, Bug, Trash2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ThemeToggle from "./ThemeToggle";
import ModeToggle from "./ModeToggle";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Gauge },
  { title: "Campaigns", url: "/campaigns", icon: BarChart3 },
  { title: "Creatives", url: "/creatives", icon: ImageIcon },
  { title: "Exchanges", url: "/exchanges", icon: Layers3 },
  { title: "Inventory", url: "/inventory", icon: Database },
  { title: "Upload", url: "/upload", icon: UploadCloud },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const clearReports = async () => {
    console.log('🔥 Clear reports button clicked!');
    
    if (!confirm('Вы уверены, что хотите очистить ВСЕ отчеты? Это действие нельзя отменить!')) {
      console.log('❌ User canceled clearing');
      return;
    }
    
    try {
      console.log('🔄 Starting to clear reports...');
      toast.loading("Очищаю отчеты...");
      
      const response = await fetch(`${import.meta.env.PROD ? 'https://web-production-37ab6.up.railway.app' : 'http://localhost:8000'}/clear-reports`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📋 Response data:', result);
      
      if (result.success) {
        console.log('✅ Reports cleared successfully');
        toast.success("✅ Все отчеты очищены!");
        // Перезагружаем страницу для обновления данных
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.log('❌ Failed to clear reports:', result.message);
        toast.error("❌ Ошибка при очистке отчетов");
      }
    } catch (error) {
      console.error('💥 Error clearing reports:', error);
      toast.error("❌ Ошибка при очистке отчетов");
      alert('Ошибка при очистке отчетов: ' + error.message);
    }
  };

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="data-[variant=sidebar]:border-r">
      <SidebarContent className="bg-background/95 backdrop-blur-sm">
        
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono font-medium text-xs tracking-wide uppercase text-muted-foreground px-3 py-2">
            NAVIGATION
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)} 
                    className="mx-2 rounded-lg transition-all duration-200 group hover:bg-muted/50 hover:text-foreground dark:text-foreground dark:hover:bg-accent/50"
                  >
                    <NavLink to={item.url} end className="flex items-center w-full px-3 py-2">
                      <item.icon className="mr-3 h-4 w-4 text-foreground" />
                      <span className="font-medium text-foreground">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Диагностика CSV */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="font-mono font-medium text-xs tracking-wide uppercase text-muted-foreground px-3 py-2">
            DIAGNOSTICS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive("/testapi")} 
                  className={`
                    mx-2 rounded-lg transition-all duration-200 group text-xs
                    ${isActive("/testapi") 
                      ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' 
                      : 'hover:bg-muted/50 hover:text-foreground'
                    }
                  `}
                >
                  <NavLink to="/testapi" end className="flex items-center w-full px-3 py-2">
                    <Bug className="mr-2 h-3 w-3" />
                    <span className="font-mono">CSV Test API</span>
                    {isActive("/testapi") && (
                      <div className="ml-auto w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <Button
                  onClick={clearReports}
                  variant="ghost"
                  size="sm"
                  className="mx-2 rounded-lg transition-all duration-200 group text-xs w-full justify-start hover:bg-red-500/10 hover:text-red-400 text-muted-foreground"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  <span className="font-mono">Clear Reports</span>
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Mode Toggle */}
        <div className="px-3 pb-2">
          <ModeToggle />
        </div>

        {/* Theme Toggle */}
        <div className="px-3 pb-4">
          <ThemeToggle />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
