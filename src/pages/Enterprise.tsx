import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import EnterpriseWebLayout from '@/components/layouts/EnterpriseWebLayout';
import EnterpriseMarketTab from '@/components/enterprise/EnterpriseMarketTab';
import EnterprisePurchasesTab from '@/components/enterprise/EnterprisePurchasesTab';
import EnterpriseReportsTab from '@/components/enterprise/EnterpriseReportsTab';
import EnterpriseSubscriptionTab from '@/components/enterprise/EnterpriseSubscriptionTab';
import EnterpriseSettingsTab from '@/components/enterprise/EnterpriseSettingsTab';
import { AdminApprovalDashboard } from '@/components/approvals/AdminApprovalDashboard';

export type EnterpriseTab = 'market' | 'purchases' | 'reports' | 'subscription' | 'settings' | 'approvals';

const Enterprise = () => {
  const location = useLocation();
  
  // URL 경로에 따라 초기 탭 설정
  const getInitialTab = (): EnterpriseTab => {
    const path = location.pathname;
    if (path.includes('/purchases')) return 'purchases';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/subscription')) return 'subscription';
    if (path.includes('/settings')) return 'settings';
    return 'market';
  };

  const [activeTab, setActiveTab] = useState<EnterpriseTab>(getInitialTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'market':
        return <EnterpriseMarketTab />;
      case 'purchases':
        return <EnterprisePurchasesTab />;
      case 'reports':
        return <EnterpriseReportsTab />;
      case 'subscription':
        return <EnterpriseSubscriptionTab />;
      case 'settings':
        return <EnterpriseSettingsTab />;
      case 'approvals':
        return <AdminApprovalDashboard />;
      default:
        return <EnterpriseMarketTab />;
    }
  };

  return (
    <EnterpriseWebLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </EnterpriseWebLayout>
  );
};

export default Enterprise;
