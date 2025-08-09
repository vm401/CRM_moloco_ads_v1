import { PropsWithChildren } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DevPanel from "@/components/DevPanel";
import LayerZeroGeometry from "@/components/LayerZeroGeometry";

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full lz-bg lz-radials lz-container">
        {/* LayerZero Geometric Background */}
        <LayerZeroGeometry />
        
        <AppSidebar />
        <SidebarInset className="relative z-10">
          <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b lz-card lz-interactive">
            <div className="container mx-auto flex h-12 items-center gap-3 px-4">
              <SidebarTrigger className="lz-ghost hover:animate-lz-glow" />
              <h1 className="text-sm md:text-base font-roboto font-medium tracking-tight text-foreground">
                <span className="lz-brand animate-lz-drift">Moloco Ads Reporting CRM</span>
              </h1>
              
              {/* Decorative elements */}
              <div className="ml-auto flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500/60 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-pink-500/60 rounded-full animate-ping"></div>
                <div className="w-1.5 h-1.5 bg-violet-500/60 rounded-full animate-bounce"></div>
              </div>
            </div>
          </header>
          
          <main className="container mx-auto px-4 py-6 relative z-10">
            <div className="relative">
              {children}
            </div>
          </main>
        </SidebarInset>
        
        <DevPanel />
      </div>
    </SidebarProvider>
  );
}
