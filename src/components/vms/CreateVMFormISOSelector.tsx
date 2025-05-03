
import { useState } from 'react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import ISOFileSelector from './ISOFileSelector';
import ExistingDiskSelector from './ExistingDiskSelector';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface CreateVMFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const CreateVMForm = ({ onSubmit, onCancel }: CreateVMFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    cpus: 1,
    memory: 1,
    diskName: '',
    os: '',
    iso: '',
    customISOPath: '',
    useCustomISOPath: false,
    networkType: 'bridge',
    networkBridge: 'br0',
    enableKVM: true,
    enableEFI: false,
    diskBus: 'virtio',
    networkModel: 'virtio-net',
    customArgs: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format the data for backend
    const submissionData = {
      ...formData,
      // If using custom path, use that instead of iso name
      iso: formData.useCustomISOPath ? formData.customISOPath : formData.iso,
    };
    
    // Remove fields not needed by backend
    delete submissionData.useCustomISOPath;
    delete submissionData.customISOPath;
    
    onSubmit(submissionData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  const handleSliderChange = (field: string, value: number[]) => {
    setFormData({
      ...formData,
      [field]: value[0],
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const FeatureTooltip = ({ children, content }: { children: React.ReactNode, content: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center">
            {children}
            <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="basic">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="storage">Storage & Network</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">VM Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="my-virtual-machine"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="os">Operating System</Label>
            <Select
              value={formData.os}
              onValueChange={(value) => handleSelectChange('os', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select OS type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="windows">Windows</SelectItem>
                <SelectItem value="ubuntu">Ubuntu</SelectItem>
                <SelectItem value="debian">Debian</SelectItem>
                <SelectItem value="centos">CentOS</SelectItem>
                <SelectItem value="fedora">Fedora</SelectItem>
                <SelectItem value="arch">Arch Linux</SelectItem>
                <SelectItem value="freebsd">FreeBSD</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              For display purposes only, not used for VM configuration
            </p>
          </div>
          
          <ISOFileSelector 
            selectedISO={formData.iso}
            onISOChange={(iso) => handleSelectChange('iso', iso)}
            customISOPath={formData.customISOPath}
            onCustomISOPathChange={(path) => handleSelectChange('customISOPath', path)}
            useCustomPath={formData.useCustomISOPath}
            onUseCustomPathChange={(use) => handleCheckboxChange('useCustomISOPath', use)}
          />
          
          <div className="space-y-2">
            <Label htmlFor="cpus">CPU Cores: {formData.cpus}</Label>
            <Slider
              value={[formData.cpus]}
              min={1}
              max={16}
              step={1}
              onValueChange={(value) => handleSliderChange('cpus', value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="memory">Memory (GB): {formData.memory}</Label>
            <Slider
              value={[formData.memory]}
              min={0.5}
              max={64}
              step={0.5}
              onValueChange={(value) => handleSliderChange('memory', value)}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="storage" className="space-y-4 mt-4">
          <ExistingDiskSelector 
            selectedDisk={formData.diskName}
            onDiskChange={(diskName) => handleSelectChange('diskName', diskName)}
          />
          
          <div className="space-y-2">
            <Label htmlFor="diskBus">Disk Interface</Label>
            <Select
              value={formData.diskBus}
              onValueChange={(value) => handleSelectChange('diskBus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select disk interface" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virtio">VirtIO (Recommended)</SelectItem>
                <SelectItem value="sata">SATA</SelectItem>
                <SelectItem value="scsi">SCSI</SelectItem>
                <SelectItem value="ide">IDE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
                <SelectItem value="bridge">Bridged</SelectItem>
                <SelectItem value="user">User (NAT)</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.networkType === 'bridge' && (
            <div className="space-y-2">
              <Label htmlFor="networkBridge">Network Bridge</Label>
              <Input
                id="networkBridge"
                name="networkBridge"
                placeholder="br0"
                value={formData.networkBridge}
                onChange={handleChange}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="networkModel">Network Adapter Model</Label>
            <Select
              value={formData.networkModel}
              onValueChange={(value) => handleSelectChange('networkModel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select network adapter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virtio-net">VirtIO (Recommended)</SelectItem>
                <SelectItem value="e1000">Intel E1000</SelectItem>
                <SelectItem value="rtl8139">Realtek RTL8139</SelectItem>
                <SelectItem value="vmxnet3">VMware vmxnet3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4 mt-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableKVM"
                checked={formData.enableKVM}
                onCheckedChange={(checked) => handleCheckboxChange('enableKVM', !!checked)}
              />
              <Label htmlFor="enableKVM">Enable KVM hardware acceleration</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Improves performance, recommended for most use cases
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableEFI"
                checked={formData.enableEFI}
                onCheckedChange={(checked) => handleCheckboxChange('enableEFI', !!checked)}
              />
              <Label htmlFor="enableEFI">Use UEFI firmware</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Required for some modern operating systems
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customArgs">Custom QEMU Arguments (advanced)</Label>
            <Textarea
              id="customArgs"
              name="customArgs"
              placeholder="-cpu host,+vmx -usb -device usb-tablet"
              value={formData.customArgs}
              onChange={handleChange}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Additional arguments to pass to QEMU. Only use if you know what you're doing.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create VM</Button>
      </DialogFooter>
    </form>
  );
};

export default CreateVMForm;
