
import { useEffect, useState } from 'react';
import { VMInfo, qemuService } from '@/services/qemuService';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

interface VMListLoaderProps {
  onVMsLoaded: (vms: VMInfo[]) => void;
  children: React.ReactNode;
  refetchTrigger?: number; // Add refetch trigger prop
}

const VMListLoader = ({ onVMsLoaded, children, refetchTrigger = 0 }: VMListLoaderProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVMs = async () => {
      try {
        setLoading(true);
        console.log('VMListLoader: Loading VMs...');
        const response = await qemuService.getVMs();
        
        if (response.data && Array.isArray(response.data)) {
          console.log('VMListLoader: VMs loaded successfully:', response.data);
          onVMsLoaded(response.data);
        } else {
          console.error('VMListLoader: Invalid VM data format:', response.data);
          setError('Invalid response format from server');
          toast.error('Failed to load VM data: Invalid format');
        }
      } catch (err) {
        console.error('VMListLoader: Error loading VMs:', err);
        setError('Failed to load VMs');
        toast.error('Failed to load VM data');
      } finally {
        setLoading(false);
      }
    };

    loadVMs();
  }, [onVMsLoaded, refetchTrigger]); // Added refetchTrigger dependency

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
          Check server connection and try again
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default VMListLoader;
