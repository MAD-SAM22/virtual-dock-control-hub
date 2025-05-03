
import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { VMInfo, qemuService } from '@/services/qemuService';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

interface VMListLoaderProps {
  onVMsLoaded: (vms: VMInfo[]) => void;
  children: React.ReactNode;
  refetchTrigger?: number;
}

export type VMListLoaderRef = {
  refresh: () => void;
};

const VMListLoader = forwardRef<VMListLoaderRef, VMListLoaderProps>(
  ({ onVMsLoaded, children, refetchTrigger = 0 }, ref) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadVMs = async () => {
      setLoading(true);
      try {
        console.log('Fetching VM list from API...');
        const response = await qemuService.getVMs();
        console.log('VM API response received:', response);
        if (response.data && Array.isArray(response.data)) {
          console.log('Valid VM data received:', response.data);
          onVMsLoaded(response.data);
          setError(null);
        } else {
          console.error('Invalid VM response format:', response);
          setError('Invalid response format');
          toast.error('Invalid VM data format received');
        }
      } catch (err) {
        console.error('Error loading VMs:', err);
        setError('Failed to load VMs');
        // Provide empty array to prevent UI from staying in loading state forever
        onVMsLoaded([]);
        toast.error('Could not fetch VMs');
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refresh: loadVMs,
    }));

    useEffect(() => {
      loadVMs();
    }, [refetchTrigger]); // Re-fetch when refetchTrigger changes

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
            Check server connection and try again.
          </p>
        </div>
      );
    }

    return <>{children}</>;
  }
);

VMListLoader.displayName = "VMListLoader";

export default VMListLoader;
