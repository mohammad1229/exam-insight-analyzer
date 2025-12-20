import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// List of sensitive localStorage keys to clear on logout
const SENSITIVE_KEYS = [
  'schoolAdminId',
  'schoolAdminName',
  'adminRole',
  'loggedInTeacher',
  'currentTeacherId',
  'currentSchoolId',
  'sysAdminLoggedIn',
  'sysAdminCredentials',
  'sysAdminSession',
  'licenseInfo',
];

export const clearSensitiveData = () => {
  SENSITIVE_KEYS.forEach(key => localStorage.removeItem(key));
  // Also clear sessionStorage
  sessionStorage.clear();
};

export const useSessionTimeout = (
  isLoggedIn: boolean,
  onLogout: () => void,
  timeoutMs: number = SESSION_TIMEOUT_MS
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTimeout = useCallback(() => {
    // Clear sensitive data
    clearSensitiveData();
    
    // Show notification
    toast({
      title: 'انتهت الجلسة',
      description: 'تم تسجيل خروجك تلقائياً بسبب عدم النشاط',
      variant: 'destructive',
    });
    
    // Call logout handler
    onLogout();
    
    // Navigate to home
    navigate('/');
  }, [onLogout, toast, navigate]);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (isLoggedIn) {
      timeoutRef.current = setTimeout(handleTimeout, timeoutMs);
    }
  }, [isLoggedIn, handleTimeout, timeoutMs]);

  useEffect(() => {
    if (!isLoggedIn) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Set initial timeout
    resetTimeout();

    // Reset timeout on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    
    const handleActivity = () => {
      resetTimeout();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isLoggedIn, resetTimeout]);

  return { resetTimeout };
};

export default useSessionTimeout;
