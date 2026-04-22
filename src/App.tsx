import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Enterprise from "./pages/Enterprise";
import PaymentComplete from "./pages/PaymentComplete";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import SecurityEngineDashboard from "./components/views/SecurityEngineDashboard";
import { ProfileProvider } from "@/contexts/ProfileContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public auth route */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Payment complete callback (public for mobile redirect) */}
          <Route path="/payment/complete" element={<PaymentComplete />} />
          
          {/* Main app - protected (개인 사용자용 모바일) */}
          <Route path="/" element={
            <ProtectedRoute>
              <ProfileProvider>
                <Index />
              </ProfileProvider>
            </ProtectedRoute>
          } />
          
          {/* Dashboard - protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ProfileProvider>
                <Dashboard />
              </ProfileProvider>
            </ProtectedRoute>
          } />
          
          {/* Enterprise B2B Dashboard - protected (기업 사용자용 웹) */}
          <Route path="/enterprise" element={
            <ProtectedRoute>
              <ProfileProvider>
                <Enterprise />
              </ProfileProvider>
            </ProtectedRoute>
          } />
          <Route path="/enterprise/*" element={
            <ProtectedRoute>
              <ProfileProvider>
                <Enterprise />
              </ProfileProvider>
            </ProtectedRoute>
          } />
          
          {/* Security Engine - protected */}
          <Route path="/security-engine" element={
            <ProtectedRoute>
              <ProfileProvider>
                <SecurityEngineDashboard />
              </ProfileProvider>
            </ProtectedRoute>
          } />
          
          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
