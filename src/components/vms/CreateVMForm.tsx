
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
import { VMInfo } from '@/services/qemuService';
import { toast } from 'sonner';
import ExistingDiskSelector from './ExistingDiskSelector';
import ISOFileSelector from './ISOFileSelector';

interface CreateVMFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialValues?: VMInfo | null;
  isEditMode?: boolean;
}

const CreateVMForm = ({ onSubmit, onCancel, initialValues, isEditMode = false }: CreateVMFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    cpus: 1,
    memory: 1,
    diskName: '',
    os: '',
    iso: '',
    customISOPath: '',
    useCustomPath: false,
    networkType: 'bridge',
    networkBridge: 'br0',
    enableKVM: true,
    enableEFI: false,
    customArgs: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize form with initial values if in edit mode
  useEffect(() => {
    if (isEditMode && initialValues) {
      setFormData({
        name: initialValues.name || '',
        cpus: typeof initialValues.cpus === 'string' ? parseInt(initialValues.cpus) : initialValues.cpus || 1,
        memory: initialValues.memory ? parseInt(initialValues.memory) : 1,
        diskName: initialValues.diskName || '',
        os: initialValues.os || '',
        iso: initialValues.iso || '',
        customISOPath: initialValues.customISOPath || '',
        useCustomPath: initialValues.useCustomPath || false,
        networkType: initialValues.networkType || 'bridge',
        networkBridge: 'br0',
        enableKVM: true,
        enableEFI: false,
        customArgs: '',
      });
    }
  }, [isEditMode, initialValues]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'VM name is required';
    }
    
    if (!formData.cpus || formData.cpus <= 0) {
      errors.cpus = 'CPU cores must be greater than 0';
    }
    
    if (!formData.memory || formData.memory <= 0) {
      errors.memory = 'Memory must be greater than 0';
    }
    
    if (!formData.diskName) {
      errors.diskName = 'Disk name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    
    if (!validateForm()) {
      toast.error('Please correct the form errors');
      return;
    }
    
    // Format the data for backend according to the expected API parameters
    const submissionData = {
      name: formData.name,
      cpus: formData.cpus,
      memory: formData.memory,
      diskName: formData.diskName,
      os: formData.os,
      iso: formData.useCustomPath ? formData.customISOPath : formData.iso,
      networkType: formData.networkType,
      networkBridge: formData.networkType === 'bridge' ? formData.networkBridge : undefined,
      enableKVM: formData.enableKVM,
      enableEFI: formData.enableEFI,
      customArgs: formData.customArgs
    };
    
    console.log('Submitting VM data:', submissionData);
    onSubmit(submissionData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Clear error for this field if it exists
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: '',
      });
    }
  };

  const handleSliderChange = (field: string, value: number[]) => {
    setFormData({
      ...formData,
      [field]: value[0],
    });
    
    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors({
        ...formErrors,
        [field]: '',
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

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
              className={formErrors.name ? "border-red-500" : ""}
            />
            {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
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
              For display purposes only
            </p>
          </div>
          
          <ISOFileSelector 
            selectedISO={formData.iso}
            onISOChange={(iso) => handleSelectChange('iso', iso)}
            customISOPath={formData.customISOPath}
            onCustomISOPathChange={(path) => handleSelectChange('customISOPath', path)}
            useCustomPath={formData.useCustomPath}
            onUseCustomPathChange={(use) => handleCheckboxChange('useCustomPath', use)}
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
            {formErrors.cpus && <p className="text-xs text-red-500">{formErrors.cpus}</p>}
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
            {formErrors.memory && <p className="text-xs text-red-500">{formErrors.memory}</p>}
          </div>
        </TabsContent>
        
        <TabsContent value="storage" className="space-y-4 mt-4">
          <ExistingDiskSelector 
            selectedDisk={formData.diskName}
            onDiskChange={(diskName) => handleSelectChange('diskName', diskName)}
          />
          {formErrors.diskName && <p className="text-xs text-red-500">{formErrors.diskName}</p>}
          
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
        <Button type="submit">{isEditMode ? 'Update VM' : 'Create VM'}</Button>
      </DialogFooter>
    </form>
  );
};

export default CreateVMForm;
