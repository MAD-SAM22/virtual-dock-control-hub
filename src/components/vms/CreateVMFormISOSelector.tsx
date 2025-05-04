
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import { VMInfo } from '@/services/qemuService';
import ISOFileSelector from './ISOFileSelector';
import ExistingDiskSelector from './ExistingDiskSelector';

interface CreateVMFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialValues?: VMInfo | null;
  isEditMode?: boolean;
}

const CreateVMForm = ({ onSubmit, onCancel, initialValues, isEditMode = false }: CreateVMFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    cpus: '1',
    memory: '1',
    os: 'Other',
    diskName: '',
    iso: '',
    networkType: 'user',
    networkBridge: 'br0',
    enableKVM: true,
    enableEFI: false,
    customArgs: '',
    customISOPath: '',
    useCustomPath: false,
  });

  // Initialize form with initial values if in edit mode
  useEffect(() => {
    if (isEditMode && initialValues) {
      setFormData({
        name: initialValues.name || '',
        cpus: String(initialValues.cpus || '1'),
        memory: initialValues.memory?.split(' ')[0] || '1',
        os: initialValues.os || 'Other',
        diskName: initialValues.diskName || '',
        iso: initialValues.iso || '',
        networkType: initialValues.networkType || 'user',
        networkBridge: 'br0',
        enableKVM: true,
        enableEFI: false,
        customArgs: '',
        customISOPath: initialValues.customISOPath || '',
        useCustomPath: initialValues.useCustomPath || false,
      });
    }
  }, [isEditMode, initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Format data for submission
    const submissionData = {
      ...formData,
      cpus: parseInt(formData.cpus),
      memory: parseInt(formData.memory),
    };

    onSubmit(submissionData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData({
      ...formData,
      [field]: checked,
    });
  };

  const handleISOChange = (iso: string) => {
    setFormData({
      ...formData,
      iso,
    });
  };

  const handleCustomISOPathChange = (path: string) => {
    setFormData({
      ...formData,
      customISOPath: path,
    });
  };

  const handleUseCustomPathChange = (use: boolean) => {
    setFormData({
      ...formData,
      useCustomPath: use,
    });
  };

  const handleDiskChange = (diskName: string) => {
    setFormData({
      ...formData,
      diskName,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">VM Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cpus">vCPUs</Label>
            <Select
              value={formData.cpus}
              onValueChange={(value) => handleSelectChange('cpus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vCPUs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 vCPU</SelectItem>
                <SelectItem value="2">2 vCPUs</SelectItem>
                <SelectItem value="4">4 vCPUs</SelectItem>
                <SelectItem value="6">6 vCPUs</SelectItem>
                <SelectItem value="8">8 vCPUs</SelectItem>
                <SelectItem value="12">12 vCPUs</SelectItem>
                <SelectItem value="16">16 vCPUs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memory">Memory (GB)</Label>
            <Select
              value={formData.memory}
              onValueChange={(value) => handleSelectChange('memory', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select memory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 GB</SelectItem>
                <SelectItem value="2">2 GB</SelectItem>
                <SelectItem value="4">4 GB</SelectItem>
                <SelectItem value="8">8 GB</SelectItem>
                <SelectItem value="16">16 GB</SelectItem>
                <SelectItem value="32">32 GB</SelectItem>
                <SelectItem value="64">64 GB</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="os">Operating System</Label>
          <Select
            value={formData.os}
            onValueChange={(value) => handleSelectChange('os', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select OS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Windows">Windows</SelectItem>
              <SelectItem value="Ubuntu">Ubuntu</SelectItem>
              <SelectItem value="Debian">Debian</SelectItem>
              <SelectItem value="CentOS">CentOS</SelectItem>
              <SelectItem value="Fedora">Fedora</SelectItem>
              <SelectItem value="FreeBSD">FreeBSD</SelectItem>
              <SelectItem value="macOS">macOS</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="existingDisk">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="existingDisk">Use Existing Disk</TabsTrigger>
            <TabsTrigger value="selectISO" disabled={isEditMode}>Boot from ISO</TabsTrigger>
          </TabsList>
          <TabsContent value="existingDisk" className="space-y-4 mt-4">
            <ExistingDiskSelector 
              selectedDisk={formData.diskName} 
              onDiskChange={handleDiskChange}
            />
          </TabsContent>
          <TabsContent value="selectISO" className="space-y-4 mt-4">
            <ISOFileSelector 
              selectedISO={formData.iso}
              onISOChange={handleISOChange}
              customISOPath={formData.customISOPath}
              onCustomISOPathChange={handleCustomISOPathChange}
              useCustomPath={formData.useCustomPath}
              onUseCustomPathChange={handleUseCustomPathChange}
            />
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="networkType">Network Type</Label>
          <Select
            value={formData.networkType}
            onValueChange={(value) => handleSelectChange('networkType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select network type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User Mode (NAT)</SelectItem>
              <SelectItem value="bridge">Bridged</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.networkType === 'bridge' && (
          <div className="space-y-2">
            <Label htmlFor="networkBridge">Bridge Interface</Label>
            <Input
              id="networkBridge"
              name="networkBridge"
              value={formData.networkBridge}
              onChange={handleChange}
              placeholder="br0"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableKVM"
              checked={formData.enableKVM}
              onCheckedChange={(checked) => handleCheckboxChange('enableKVM', !!checked)}
            />
            <Label htmlFor="enableKVM">Enable KVM acceleration</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableEFI"
              checked={formData.enableEFI}
              onCheckedChange={(checked) => handleCheckboxChange('enableEFI', !!checked)}
            />
            <Label htmlFor="enableEFI">Enable EFI (UEFI) boot</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customArgs">Custom QEMU Arguments (Advanced)</Label>
          <Input
            id="customArgs"
            name="customArgs"
            value={formData.customArgs}
            onChange={handleChange}
            placeholder="-cpu host -display vnc=:0"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditMode ? 'Update VM' : 'Create VM'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default CreateVMForm;

