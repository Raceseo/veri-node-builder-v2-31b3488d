import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface DataAccessRequest {
  id: string;
  buyer_id: string;
  supplier_id: string;
  purchase_id: string | null;
  request_type: string;
  data_categories: string[];
  offered_price: number;
  message: string | null;
  supplier_status: string;
  supplier_responded_at: string | null;
  admin_status: string;
  first_admin_id: string | null;
  second_admin_id: string | null;
  final_status: string;
  completed_at: string | null;
  created_at: string;
}

export const useDataAccessRequests = (role: 'supplier' | 'buyer' | 'admin') => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['data-access-requests', role, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase.from('data_access_requests').select('*');

      if (role === 'supplier') {
        query = query.eq('supplier_id', user.id);
      } else if (role === 'buyer') {
        query = query.eq('buyer_id', user.id);
      }
      // admin sees all via RLS

      const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return (data || []) as DataAccessRequest[];
    },
    enabled: !!user?.id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`dar-${role}-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'data_access_requests',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['data-access-requests'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, role, queryClient]);

  const invoke = async (action: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('handle-data-access-request', {
      body: { action, ...payload },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const createRequest = useMutation({
    mutationFn: (p: { supplierId: string; dataCategories: string[]; offeredPrice: number; message?: string; requestType?: string }) =>
      invoke('create_request', p),
    onSuccess: () => {
      toast({ title: '요청 완료', description: '데이터 접근 요청이 전송되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['data-access-requests'] });
    },
    onError: (e: Error) => toast({ title: '요청 실패', description: e.message, variant: 'destructive' }),
  });

  const supplierRespond = useMutation({
    mutationFn: (p: { requestId: string; decision: 'approved' | 'rejected' }) =>
      invoke('supplier_respond', p),
    onSuccess: (_, v) => {
      toast({ title: v.decision === 'approved' ? '승인 완료' : '거절 완료' });
      queryClient.invalidateQueries({ queryKey: ['data-access-requests'] });
    },
    onError: (e: Error) => toast({ title: '처리 실패', description: e.message, variant: 'destructive' }),
  });

  const adminApprove = useMutation({
    mutationFn: (p: { requestId: string }) => invoke('admin_approve', p),
    onSuccess: (data) => {
      toast({ title: '관리자 승인', description: data.message });
      queryClient.invalidateQueries({ queryKey: ['data-access-requests'] });
    },
    onError: (e: Error) => toast({ title: '승인 실패', description: e.message, variant: 'destructive' }),
  });

  const adminReject = useMutation({
    mutationFn: (p: { requestId: string; reason?: string }) => invoke('admin_reject', p),
    onSuccess: () => {
      toast({ title: '거절 완료' });
      queryClient.invalidateQueries({ queryKey: ['data-access-requests'] });
    },
    onError: (e: Error) => toast({ title: '거절 실패', description: e.message, variant: 'destructive' }),
  });

  return {
    requests: requests || [],
    isLoading,
    error,
    createRequest,
    supplierRespond,
    adminApprove,
    adminReject,
  };
};
