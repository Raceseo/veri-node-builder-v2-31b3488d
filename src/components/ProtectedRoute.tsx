import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-navy-dark via-navy to-navy flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Shield className="w-16 h-16 text-trust animate-pulse" />
            <div className="absolute inset-0 bg-trust/20 blur-xl rounded-full" />
          </div>
          <p className="text-white/60 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
