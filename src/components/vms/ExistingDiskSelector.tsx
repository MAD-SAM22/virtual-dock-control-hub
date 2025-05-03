
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader } from 'lucide-react';
import { DiskInfo, virtualDiskService } from '@/services/virtualDiskService';

interface ExistingDiskSelectorProps {
  selectedDisk: string;
  onDiskChange: (diskName: string) => void;
}

const ExistingDiskSelector = ({ selectedDisk, onDiskChange }: ExistingDiskSelectorProps) => {
  const [disks, setDisks] = useState<DiskInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDisks = async () => {
      setLoading(true);
      try {
        console.log('Fetching virtual disks...');
        const disksData = await virtualDiskService.listDisks();
        console.log('Disks fetched:', disksData);
        setDisks(disksData);
        setError(null);
        
        // If we have disks and none selected yet, select the first one
        if (disksData.length > 0 && !selectedDisk) {
          onDiskChange(disksData[0].name);
        }
      } catch (err) {
        console.error('Failed to fetch disks:', err);
        setError('Could not fetch disk list');
        toast.error('Failed to load virtual disks');
      } finally {
        setLoading(false);
      }
    };

    fetchDisks();
  }, [selectedDisk, onDiskChange]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader className="h-4 w-4 animate-spin" />
        <span>Loading disks...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  if (disks.length === 0) {
    return (
      <div className="text-amber-500">
        No virtual disks available. Please create a disk first on the Virtual Disks page.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="existingDisk">Select Existing Disk</Label>
      <Select
        value={selectedDisk}
        onValueChange={(value) => onDiskChange(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a disk" />
        </SelectTrigger>
        <SelectContent>
          {disks.map((disk) => (
            <SelectItem key={disk.name} value={disk.name}>
              {disk.name} ({disk.size}GB, {disk.format})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ExistingDiskSelector;
