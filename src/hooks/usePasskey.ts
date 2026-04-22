import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PasskeyDevice {
  id: string;
  device_name: string;
  created_at: string;
  last_used_at: string | null;
}

export const usePasskey = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [registeredDevices, setRegisteredDevices] = useState<PasskeyDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);

  // 브라우저 Passkey 지원 여부 확인
  useEffect(() => {
    const checkSupport = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch {
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    };
    checkSupport();
  }, []);

  // 등록된 기기 목록 조회
  const fetchRegisteredDevices = useCallback(async () => {
    if (!user) {
      setRegisteredDevices([]);
      setIsCheckingRegistration(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_passkeys')
        .select('id, device_name, created_at, last_used_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegisteredDevices(data || []);
    } catch (error) {
      console.error('Passkey 조회 오류:', error);
      setRegisteredDevices([]);
    } finally {
      setIsCheckingRegistration(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRegisteredDevices();
  }, [fetchRegisteredDevices]);

  // 현재 기기 등록
  const registerPasskey = async (deviceName?: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    if (!isSupported) {
      return { success: false, error: '이 기기는 생체 인증을 지원하지 않습니다' };
    }

    setIsLoading(true);

    try {
      // 1. 등록 옵션 요청
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const optionsResponse = await supabase.functions.invoke('webauthn-register-options', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (optionsResponse.error || !optionsResponse.data?.options) {
        throw new Error(optionsResponse.data?.error || '등록 옵션 요청 실패');
      }

      const { options } = optionsResponse.data;

      // 2. 브라우저 WebAuthn API 호출
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: base64URLToBuffer(options.challenge),
          user: {
            ...options.user,
            id: base64URLToBuffer(options.user.id)
          },
          excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
            ...cred,
            id: base64URLToBuffer(cred.id)
          }))
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('생체 인증이 취소되었습니다');
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // 3. 서버에 검증 요청
      const verifyResponse = await supabase.functions.invoke('webauthn-register-verify', {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          credential: {
            id: credential.id,
            rawId: bufferToBase64URL(credential.rawId),
            type: credential.type,
            response: {
              clientDataJSON: bufferToBase64URL(response.clientDataJSON),
              attestationObject: bufferToBase64URL(response.attestationObject),
              transports: response.getTransports?.() || ['internal']
            }
          },
          deviceName: deviceName || getDeviceName()
        }
      });

      if (verifyResponse.error || !verifyResponse.data?.success) {
        throw new Error(verifyResponse.data?.error || '등록 검증 실패');
      }

      // 목록 새로고침
      await fetchRegisteredDevices();

      return { success: true };
    } catch (error: any) {
      console.error('Passkey 등록 오류:', error);
      
      // WebAuthn 에러 처리
      if (error.name === 'NotAllowedError') {
        return { success: false, error: '생체 인증이 취소되었습니다' };
      }
      if (error.name === 'InvalidStateError') {
        return { success: false, error: '이미 등록된 기기입니다' };
      }
      
      return { success: false, error: error.message || '등록 중 오류가 발생했습니다' };
    } finally {
      setIsLoading(false);
    }
  };

  // 생체 인증으로 로그인
  const authenticateWithPasskey = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupported) {
      return { success: false, error: '이 기기는 생체 인증을 지원하지 않습니다' };
    }

    setIsLoading(true);

    try {
      // 1. 인증 옵션 요청
      const optionsResponse = await supabase.functions.invoke('webauthn-authenticate-options', {
        body: { email }
      });

      if (optionsResponse.error || !optionsResponse.data?.options) {
        throw new Error(optionsResponse.data?.error || '인증 옵션 요청 실패');
      }

      const { options } = optionsResponse.data;

      // 2. 브라우저 WebAuthn API 호출
      const credential = await navigator.credentials.get({
        publicKey: {
          ...options,
          challenge: base64URLToBuffer(options.challenge),
          allowCredentials: options.allowCredentials?.map((cred: any) => ({
            ...cred,
            id: base64URLToBuffer(cred.id)
          }))
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('생체 인증이 취소되었습니다');
      }

      const response = credential.response as AuthenticatorAssertionResponse;

      // 3. 서버에 검증 요청
      const verifyResponse = await supabase.functions.invoke('webauthn-authenticate-verify', {
        body: {
          credential: {
            id: credential.id,
            rawId: bufferToBase64URL(credential.rawId),
            type: credential.type,
            response: {
              clientDataJSON: bufferToBase64URL(response.clientDataJSON),
              authenticatorData: bufferToBase64URL(response.authenticatorData),
              signature: bufferToBase64URL(response.signature),
              userHandle: response.userHandle ? bufferToBase64URL(response.userHandle) : null
            }
          },
          email
        }
      });

      if (verifyResponse.error || !verifyResponse.data?.success) {
        throw new Error(verifyResponse.data?.error || '인증 검증 실패');
      }

      // 4. 토큰으로 세션 생성
      const { token, type } = verifyResponse.data;
      
      const { error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any
      });

      if (sessionError) {
        throw new Error('세션 생성 실패');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Passkey 인증 오류:', error);
      
      if (error.name === 'NotAllowedError') {
        return { success: false, error: '생체 인증이 취소되었습니다' };
      }
      
      return { success: false, error: error.message || '인증 중 오류가 발생했습니다' };
    } finally {
      setIsLoading(false);
    }
  };

  // Passkey 삭제
  const deletePasskey = async (passkeyId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    try {
      const { error } = await supabase
        .from('user_passkeys')
        .delete()
        .eq('id', passkeyId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchRegisteredDevices();
      return { success: true };
    } catch (error: any) {
      console.error('Passkey 삭제 오류:', error);
      return { success: false, error: error.message || '삭제 중 오류가 발생했습니다' };
    }
  };

  // 이메일로 등록된 passkey 존재 여부 확인 (로그인 전)
  const checkPasskeyExists = useCallback(async (email: string): Promise<boolean> => {
    try {
      const response = await supabase.functions.invoke('webauthn-authenticate-options', {
        body: { email }
      });
      return !response.error && !!response.data?.options;
    } catch {
      return false;
    }
  }, []);

  return {
    isSupported,
    isLoading,
    isCheckingRegistration,
    registeredDevices,
    hasRegisteredPasskey: registeredDevices.length > 0,
    registerPasskey,
    authenticateWithPasskey,
    deletePasskey,
    checkPasskeyExists,
    refreshDevices: fetchRegisteredDevices
  };
};

// 헬퍼 함수들
function base64URLToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binaryStr = atob(paddedBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binaryStr = String.fromCharCode(...bytes);
  const base64 = btoa(binaryStr);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) {
    const match = ua.match(/Android.*?;\s*([^;)]+)/);
    return match ? match[1].trim() : 'Android Device';
  }
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux PC';
  
  return 'Unknown Device';
}
