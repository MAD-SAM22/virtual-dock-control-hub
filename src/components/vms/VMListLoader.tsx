import { useEffect, useState, useCallback } from 'react';
import { VMInfo, qemuService } from '@/services/qemuService';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

interface VMListLoaderProps {
  onVMsLoaded: (vms: VMInfo[]) => void;
  children: React.ReactNode;
}

const POLLING_INTERVAL_MS = 10000; // adjust or disable

const VMListLoader = ({ onVMsLoaded, children }: VMListLoaderProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVMs = useCallback(async () => {
    try {
      const response = await qemuService.getVMs();
      if (response.data && Array.isArray(response.data)) {
        console.log('✅ VMs loaded:', response.data);
        onVMsLoaded(response.data);
        setError(null);
      } else {
        console.error('❌ Invalid VM data:', response.data);
        setError('Invalid response format from server');
        toast.error('Invalid VM data format');
      }
    } catch (err) {
      console.error('❌ Error loading VMs:', err);
      setError('Failed to load VMs');
      toast.error('Could not fetch VMs');
    } finally {
      setLoading(false);
    }
  }, [onVMsLoaded]);

  useEffect(() => {
    let isMounted = true;

    const safeLoad = async () => {
      if (!isMounted) return;
      await loadVMs();
    };

    safeLoad();

    const intervalId = setInterval(() => {
      if (isMounted) loadVMs();
    }, POLLING_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [loadVMs]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading virtual machines...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Please check the server and try again.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default VMListLoader;
