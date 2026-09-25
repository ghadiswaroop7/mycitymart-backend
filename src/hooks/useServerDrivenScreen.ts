import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  ServerDrivenScreenLayout,
  UserTargetingContext,
} from '../contracts/sduiContracts';
import { DEFAULT_HOME_LAYOUT } from '../contracts/defaultHomeLayout';
import {
  fetchScreenLayout,
  subscribeToScreenLayout,
} from '../services/sduiService';

export interface UseServerDrivenScreenOptions {
  /** Target screen ID (e.g. 'home', 'category', 'search', 'pdp') */
  screenId: string;
  /** Explicit city override if different from Redux user state */
  city?: string;
  /** Explicit userSegment override (e.g. 'new_user', 'vip') */
  userSegment?: string;
}

export interface UseServerDrivenScreenResult {
  layout: ServerDrivenScreenLayout;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useServerDrivenScreen({
  screenId,
  city: explicitCity,
  userSegment: explicitUserSegment,
}: UseServerDrivenScreenOptions): UseServerDrivenScreenResult {
  const [layout, setLayout] = useState<ServerDrivenScreenLayout>(DEFAULT_HOME_LAYOUT);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Read city and user auth from Redux
  const userCity = useSelector((state: any) => state.user?.city || state.profile?.profile?.city || state.auth?.user?.city || 'Sangamner');
  const userRole = useSelector((state: any) => state.auth?.user?.role || 'general');

  const context: UserTargetingContext = {
    city: explicitCity || userCity,
    userSegment: explicitUserSegment || userRole,
    appVersion: '1.0.0',
  };

  const contextRef = useRef(context);
  contextRef.current = context;

  // Real-time subscription to published layout
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToScreenLayout(
      screenId,
      contextRef.current,
      (newLayout) => {
        setLayout(newLayout);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [screenId, context.city, context.userSegment]);

  // Pull-to-refresh handler
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const refreshedLayout = await fetchScreenLayout(screenId, contextRef.current);
      setLayout(refreshedLayout);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setRefreshing(false);
    }
  }, [screenId]);

  return {
    layout,
    loading,
    refreshing,
    error,
    refresh,
  };
}

export default useServerDrivenScreen;
