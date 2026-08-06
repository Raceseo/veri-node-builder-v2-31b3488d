// deploy trigger 3
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootEntry from "./pages/RootEntry";
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
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public auth route */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Payment complete callback (public for mobile redirect) */}
          <Route path="/payment/complete" element={<PaymentComplete />} />
          
          {/* Main app - 공개 진입점 (B-19).
              RootEntry 가 세션을 보고 분기한다:
                비로그인 → 랜딩(IntroView) / 로그인 → ProfileProvider + Index.
              ⚠️ ProtectedRoute 를 여기서 뗀 것은 의도된 변경이다. 아래 보호 라우트는 그대로. */}
          <Route path="/" element={<RootEntry />} />
          
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
