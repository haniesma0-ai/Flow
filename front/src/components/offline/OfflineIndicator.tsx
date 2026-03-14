import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);
  const [pendingActions, setPendingActions] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connexion rétablie', {
        description: 'Vos données vont être synchronisées',
      });
      // Simulate sync
      setTimeout(() => {
        setPendingActions(0);
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
      toast.warning('Mode hors ligne activé', {
        description: 'Vos actions seront synchronisées plus tard',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate pending actions for demo
    const interval = setInterval(() => {
      if (!isOnline && pendingActions < 5) {
        setPendingActions((prev) => prev + 1);
      }
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline, pendingActions]);

  if (isOnline && !showIndicator) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isOnline ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {!isOnline ? (
        <div className="bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <WifiOff className="w-5 h-5" />
          <div>
            <p className="font-medium">Hors ligne</p>
            {pendingActions > 0 && (
              <p className="text-sm text-white/80">
                {pendingActions} action(s) en attente
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <div>
            <p className="font-medium">Synchronisation...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
