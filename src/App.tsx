import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "./layouts/AppLayout";
import Layout from "./components/Layout";
import "./styles/revenue-cat.css";

// Lazy loading для лучшей производительности
const SinglePageApp = lazy(() => import("./pages/SinglePageApp"));
const TestApi = lazy(() => import("./pages/TestApi"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const Creatives = lazy(() => import("./pages/Creatives"));
const Exchanges = lazy(() => import("./pages/Exchanges"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Upload = lazy(() => import("./pages/Upload"));
const Apps = lazy(() => import("./pages/Apps"));
const CreativeDatabase = lazy(() => import("./pages/CreativeDatabase"));
const ExchangesWithFilters = lazy(() => import("./pages/ExchangesWithFilters"));
const InventoryWithFilters = lazy(() => import("./pages/InventoryWithFilters"));
const CampaignsWithFilters = lazy(() => import("./pages/CampaignsWithFilters"));
const UploadWithMulti = lazy(() => import("./pages/UploadWithMulti"));

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
          {/* Новые страницы с Layout и фильтрами */}
          <Route path="/inventory" element={<Layout><Suspense fallback={<LoadingSpinner />}><InventoryWithFilters /></Suspense></Layout>} />
          <Route path="/campaigns" element={<Layout><Suspense fallback={<LoadingSpinner />}><CampaignsWithFilters /></Suspense></Layout>} />
          <Route path="/creatives" element={<Layout><Suspense fallback={<LoadingSpinner />}><Creatives /></Suspense></Layout>} />
          <Route path="/apps" element={<Layout><Suspense fallback={<LoadingSpinner />}><Apps /></Suspense></Layout>} />
          <Route path="/exchanges" element={<Layout><Suspense fallback={<LoadingSpinner />}><ExchangesWithFilters /></Suspense></Layout>} />
          <Route path="/upload" element={<Layout><Suspense fallback={<LoadingSpinner />}><UploadWithMulti /></Suspense></Layout>} />
          <Route path="/creative-database" element={<Layout><Suspense fallback={<LoadingSpinner />}><CreativeDatabase /></Suspense></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
