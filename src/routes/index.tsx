/**
 * VeriNode 라우트 설정
 * Phase 2: React Router 기반 라우팅으로 전환
 * 
 * 구조:
 * - /onboarding/* : 온보딩 플로우
 * - /supplier/*   : 공급자(개인) 모드
 * - /demand/*     : 수요자(기업) 모드
 * - /dashboard/*  : 대시보드 관련
 */

import React, { lazy, Suspense } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Lazy load views for code splitting
const IntroView = lazy(() => import('@/components/views/IntroView'));
const SovereigntyDeclarationView = lazy(() => import('@/components/views/SovereigntyDeclarationView'));
const SocialPromiseView = lazy(() => import('@/components/views/SocialPromiseView'));
const DualModeEntryView = lazy(() => import('@/components/views/DualModeEntryView'));

// Layouts
const SupplierLayout = lazy(() => import('@/components/layouts/SupplierLayout'));
const DemandLayout = lazy(() => import('@/components/layouts/DemandLayout'));

// Dashboard views
const UnifiedDashboard = lazy(() => import('@/components/views/UnifiedDashboard'));
const IndividualDashboard = lazy(() => import('@/components/views/IndividualDashboard'));
const EnterpriseDashboard = lazy(() => import('@/components/views/EnterpriseDashboard'));
const PolicyDashboard = lazy(() => import('@/components/views/PolicyDashboard'));
const TerminalDashboard = lazy(() => import('@/components/views/TerminalDashboard'));

// Feature views
const WalletView = lazy(() => import('@/components/views/WalletView'));
const HistoryView = lazy(() => import('@/components/views/HistoryView'));
const MyPageView = lazy(() => import('@/components/views/MyPageView'));
const AntiCherryPickerSurveyView = lazy(() => import('@/components/views/AntiCherryPickerSurveyView'));
const MyDataUploadView = lazy(() => import('@/components/views/MyDataUploadView'));
const DataPortfolioView = lazy(() => import('@/components/views/DataPortfolioView'));
const RevenueSourceView = lazy(() => import('@/components/views/RevenueSourceView'));

// Wrapper component for lazy loading
export const LazyView: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

// Route definitions type
export interface AppRouteObject extends Omit<RouteObject, 'children'> {
  children?: AppRouteObject[];
}

// Onboarding routes
export const onboardingRoutes: AppRouteObject[] = [
  {
    path: 'intro',
    element: <LazyView><IntroView onStart={() => window.location.href = '/onboarding/sovereignty'} /></LazyView>,
  },
  {
    path: 'sovereignty',
    element: <LazyView><SovereigntyDeclarationView onComplete={() => window.location.href = '/onboarding/promise'} /></LazyView>,
  },
  {
    path: 'promise',
    element: <LazyView><SocialPromiseView onComplete={() => window.location.href = '/onboarding/select-mode'} displayName="사용자" /></LazyView>,
  },
  {
    path: 'select-mode',
    element: <LazyView><DualModeEntryView onComplete={(type) => {
      if (type === 'enterprise') {
        window.location.href = '/demand';
      } else {
        window.location.href = '/supplier';
      }
    }} /></LazyView>,
  },
];

// Supplier (Individual) routes
export const supplierRoutes: AppRouteObject[] = [
  {
    index: true,
    element: <Navigate to="/supplier/home" replace />,
  },
  {
    path: 'home',
    element: <LazyView><SupplierLayout /></LazyView>,
  },
  {
    path: 'wallet',
    element: <LazyView><WalletView /></LazyView>,
  },
  {
    path: 'history',
    element: <LazyView><HistoryView /></LazyView>,
  },
  {
    path: 'mypage',
    element: <LazyView><MyPageView /></LazyView>,
  },
  {
    path: 'verify',
    element: <LazyView><AntiCherryPickerSurveyView onBack={() => window.location.href = '/supplier/home'} onComplete={() => window.location.href = '/supplier/home'} /></LazyView>,
  },
  {
    path: 'upload',
    element: <LazyView><MyDataUploadView onBack={() => window.location.href = '/supplier/home'} /></LazyView>,
  },
  {
    path: 'portfolio',
    element: <LazyView><DataPortfolioView onBack={() => window.location.href = '/supplier/home'} /></LazyView>,
  },
];

// Demand (Enterprise) routes  
export const demandRoutes: AppRouteObject[] = [
  {
    index: true,
    element: <Navigate to="/demand/market" replace />,
  },
  {
    path: '*',
    element: <LazyView><DemandLayout /></LazyView>,
  },
];

// Dashboard routes
export const dashboardRoutes: AppRouteObject[] = [
  {
    path: 'individual',
    element: <LazyView><IndividualDashboard 
      trustScore={0}
      vnBalance={0}
      displayName="사용자"
      onOpenSurvey={() => {}}
      onOpenWallet={() => {}}
      onOpenMyDataUpload={() => {}}
      onOpenVCoreAsset={() => {}}
      onOpenTerminal={() => {}}
      onOpenCategoryMonitor={() => {}}
      onOpenPortfolio={() => {}}
      onOpenAssetOptimization={() => {}}
    /></LazyView>,
  },
  {
    path: 'enterprise',
    element: <LazyView><EnterpriseDashboard 
      companyName="기업"
      vnBalance={0}
      onOpenMarketplace={() => {}}
      onOpenSecurityReport={() => {}}
      onOpenDataQuality={() => {}}
      onOpenSubscription={() => {}}
      onOpenWinWin={() => {}}
      onOpenDataHub={() => {}}
    /></LazyView>,
  },
  {
    path: 'policy',
    element: <LazyView><PolicyDashboard onBack={() => window.location.href = '/supplier/home'} /></LazyView>,
  },
  {
    path: 'terminal',
    element: <LazyView><TerminalDashboard onBack={() => window.location.href = '/supplier/home'} onOpenMarketplace={() => {}} /></LazyView>,
  },
];
