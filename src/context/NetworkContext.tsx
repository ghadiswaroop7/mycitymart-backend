import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Animated, StatusBar } from 'react-native';
import * as Network from 'expo-network';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
  checkConnection: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: 'UNKNOWN',
  checkConnection: async () => true,
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string>('UNKNOWN');
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  const bannerAnim = React.useRef(new Animated.Value(-60)).current;

  const updateNetworkStatus = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
        setIsConnected(online);
        setIsInternetReachable(online);
        setConnectionType(online ? 'WIFI' : 'NONE');
        return online;
      }

      const state = await Network.getNetworkStateAsync();
      const connected = Boolean(state.isConnected && (state.isInternetReachable !== false));
      setIsConnected(Boolean(state.isConnected));
      setIsInternetReachable(state.isInternetReachable ?? null);
      setConnectionType(state.type || 'UNKNOWN');
      return connected;
    } catch (e) {
      // Default to optimistic connected if check throws
      return true;
    }
  }, []);

  // Check connection on mount and interval
  useEffect(() => {
    updateNetworkStatus();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        setIsConnected(true);
        setIsInternetReachable(true);
      };
      const handleOffline = () => {
        setIsConnected(false);
        setIsInternetReachable(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // Periodically check connectivity (every 5 seconds) to catch drop/recovery smoothly
      const interval = setInterval(() => {
        updateNetworkStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [updateNetworkStatus]);

  // Handle banner animation when connectivity changes
  useEffect(() => {
    const isOfflineNow = !isConnected || isInternetReachable === false;

    if (isOfflineNow) {
      setWasOffline(true);
      setShowBanner(true);
      Animated.spring(bannerAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else if (wasOffline) {
      // We just recovered from offline! Show "Back Online" in green, then hide after 2.5s
      setShowBanner(true);
      Animated.spring(bannerAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();

      const hideTimer = setTimeout(() => {
        Animated.timing(bannerAnim, {
          toValue: -60,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowBanner(false);
          setWasOffline(false);
        });
      }, 2500);

      return () => clearTimeout(hideTimer);
    }
  }, [isConnected, isInternetReachable, wasOffline]);

  const checkConnection = async (): Promise<boolean> => {
    return await updateNetworkStatus();
  };

  const isOffline = !isConnected || isInternetReachable === false;

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isInternetReachable,
        connectionType,
        checkConnection,
      }}
    >
      <View style={styles.container}>
        {children}

        {/* Amazon-style Floating Connectivity Banner */}
        {showBanner && (
          <Animated.View
            style={[
              styles.banner,
              isOffline ? styles.offlineBanner : styles.onlineBanner,
              { transform: [{ translateY: bannerAnim }] },
            ]}
          >
            <Text style={styles.bannerText}>
              {isOffline
                ? '⚠️ No Internet Connection • You are offline'
                : '✓ Back Online • Internet connected'}
            </Text>
          </Animated.View>
        )}
      </View>
    </NetworkContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0),
    left: 16,
    right: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  offlineBanner: {
    backgroundColor: '#DC2626', // Red/Amber offline
  },
  onlineBanner: {
    backgroundColor: '#059669', // Emerald green online
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default NetworkProvider;
