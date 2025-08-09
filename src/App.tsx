import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "./layouts/AppLayout";

// Lazy loading для лучшей производительности
const SinglePageApp = lazy(() => import("./pages/SinglePageApp"));
const TestApi = lazy(() => import("./pages/TestApi"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const Creatives = lazy(() => import("./pages/Creatives"));
const Exchanges = lazy(() => import("./pages/Exchanges"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Upload = lazy(() => import("./pages/Upload"));

// Loading компонент
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Данные всегда считаются устаревшими
      refetchOnWindowFocus: true, // Обновлять при фокусе окна
      refetchOnMount: true, // Обновлять при монтировании
      retry: 1, // Повторить только 1 раз при ошибке
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<Suspense fallback={<LoadingSpinner />}><SinglePageApp /></Suspense>} />
          <Route path="/testapi" element={<AppLayout><Suspense fallback={<LoadingSpinner />}><TestApi /></Suspense></AppLayout>} />
          {/* Старые роуты - классический режим */}
          <Route path="/dashboard" element={<AppLayout><Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense></AppLayout>} />
          <Route path="/inventory" element={<AppLayout><Suspense fallback={<LoadingSpinner />}><Inventory /></Suspense></AppLayout>} />
          <Route path="/campaigns" element={<AppLayout><Suspense fallback={<LoadingSpinner />}><Campaigns /></Suspense></AppLayout>} />
          <Route path="/creatives" element={<AppLayout><Suspense fallback={<LoadingSpinner />}><Creatives /></Suspense></AppLayout>} />
          <Route path="/exchanges" element={<AppLayout><Suspense fallback={<LoadingSpinner />}><Exchanges /></Suspense></AppLayout>} />
          <Route path="/upload" element={<AppLayout><Suspense fallback={<LoadingSpinner />}><Upload /></Suspense></AppLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
