import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { VMInfo, qemuService } from '@/services/qemuService';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

interface VMListLoaderProps {
  onVMsLoaded: (vms: VMInfo[]) => void;
  children: React.ReactNode;
}

export type VMListLoaderRef = {
  refresh: () => void;
};

const VMListLoader = forwardRef<VMListLoaderRef, VMListLoaderProps>(
  ({ onVMsLoaded, children }, ref) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadVMs = async () => {
      setLoading(true);
      try {
        const response = await qemuService.getVMs();
        if (response.data && Array.isArray(response.data)) {
          onVMsLoaded(response.data);
          setError(null);
        } else {
          setError('Invalid response format');
          toast.error('Invalid VM data');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load VMs');
        toast.error('Could not fetch VMs');
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refresh: loadVMs,
    }));

    useEffect(() => {
      loadVMs(); // load once
    }, []);

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

// ✅ VERY IMPORTANT:
export default forwardRef(VMListLoader);
