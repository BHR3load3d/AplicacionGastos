import React, { createContext, useContext, useState, useEffect } from 'react';
import { SyncService } from 'services/SyncService';
import { FamilyService } from 'services/FamilyService';
import { useNotification } from './NotificationContext';
import { SyncResult } from 'types/SyncTypes';

interface AppContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncNow: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
  isOnline: true,
  isSyncing: false,
  lastSyncTime: null,
  syncNow: async () => {},
});

export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotification('Back online', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      showNotification('Working offline', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize family and start sync
    const initializeApp = async () => {
      try {
        await FamilyService.ensureDefaultFamily();

        // Force immediate sync on load only if online
        if (navigator.onLine) {
          setIsSyncing(true);
          try {
            const results = await SyncService.syncAll();
            const hasErrors = results.some((r: SyncResult) => !r.success);
            showNotification(
              hasErrors ? 'Some items failed to sync' : 'Sync completed successfully',
              hasErrors ? 'warning' : 'success'
            );
            setLastSyncTime(new Date());
          } catch (err) {
            console.error('Initial sync error:', err);
            showNotification('Failed to sync', 'error');
          } finally {
            setIsSyncing(false);
          }
        }

        // Start periodic sync after initial step
        await SyncService.startPeriodicSync();
      } catch (error) {
        showNotification('Error initializing app', 'error');
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showNotification]);

  const syncNow = async () => {
    if (!isOnline) {
      showNotification('Cannot sync while offline', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const results = await SyncService.syncAll();
      const errors = results.filter((r: SyncResult) => !r.success);
      
      if (errors.length > 0) {
        showNotification('Some items failed to sync', 'warning');
      } else {
        showNotification('Sync completed successfully', 'success');
      }
      
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync error:', error);
      showNotification('Failed to sync', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isOnline,
        isSyncing,
        lastSyncTime,
        syncNow,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};