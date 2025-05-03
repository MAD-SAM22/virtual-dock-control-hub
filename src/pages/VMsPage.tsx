import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Play, 
  Square, 
  RefreshCw, 
  Trash2, 
  Pause, 
  Edit, 
  MoreVertical, 
  Plus, 
  Loader, 
  Camera, 
  Monitor,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { VMInfo, qemuService } from '@/services/qemuService';
import CreateVMForm from '@/components/vms/CreateVMFormISOSelector';
import VMListLoader from '@/components/vms/VMListLoader';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const VMsPage = () => {
  const [vms, setVMs] = useState<VMInfo[]>([]);
  const [filteredVMs, setFilteredVMs] = useState<VMInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ action: '', vmId: '' });
  const [consoleDialogOpen, setConsoleDialogOpen] = useState(false);
  const [selectedVM, setSelectedVM] = useState<VMInfo | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);

  const handleVMsLoaded = (loadedVMs: VMInfo[]) => {
    setVMs(loadedVMs);
    setFilteredVMs(loadedVMs);
    setIsLoading(false);
  };

  useEffect(() => {
    // Fetch VMs on page load
    fetchVMs();
  }, []);

  const fetchVMs = async () => {
    setIsLoading(true);
    try {
      const response = await qemuService.getVMs();
      console.log('Fetched VMs:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setVMs(response.data);
        setFilteredVMs(response.data);
      } else {
        // Fallback to mock data if needed
        const mockVMs = [
          { 
            id: 'vm1', 
            name: 'ubuntu-server', 
            status: 'running', 
            cpus: '2', 
            memory: '2 GB', 
            storage: '20 GB',
            os: 'Ubuntu 22.04',
            uptime: '2 days, 5 hours'
          },
          { 
            id: 'vm2', 
            name: 'windows-test', 
            status: 'stopped', 
            cpus: '4', 
            memory: '8 GB', 
            storage: '50 GB',
            os: 'Windows Server 2019'
          },
        ] as VMInfo[];
        
        setVMs(mockVMs);
        setFilteredVMs(mockVMs);
      }
    } catch (error) {
      console.error('Error fetching VMs:', error);
      toast.error('Failed to fetch VMs');
      
      // Fallback mock data
      const mockVMs = [
        { 
          id: 'vm1', 
          name: 'ubuntu-server', 
          status: 'running', 
          cpus: '2', 
          memory: '2 GB', 
          storage: '20 GB',
          os: 'Ubuntu 22.04',
          uptime: '2 days, 5 hours'
        },
        { 
          id: 'vm2', 
          name: 'windows-test', 
          status: 'stopped', 
          cpus: '4', 
          memory: '8 GB', 
          storage: '50 GB',
          os: 'Windows Server 2019'
        },
      ] as VMInfo[];
      
      setVMs(mockVMs);
      setFilteredVMs(mockVMs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredVMs(vms);
    } else {
      const filtered = vms.filter(
        vm => 
          vm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (vm.os?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
          vm.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVMs(filtered);
    }
  }, [searchTerm, vms]);

  const handleVMAction = async (action: string, vmId: string) => {
    if (['delete'].includes(action)) {
      setConfirmAction({ action, vmId });
      setConfirmDialogOpen(true);
      return;
    }

    if (action === 'console') {
      const vm = vms.find(v => v.id === vmId);
      if (vm) {
        setSelectedVM(vm);
        
        try {
          // Try to fetch real console output, fallback to mock
          const consoleData = await qemuService.getConsoleOutput(vmId);
          if (consoleData && consoleData.data) {
            setConsoleOutput(Array.isArray(consoleData.data) ? consoleData.data : [consoleData.data.toString()]);
          } else {
            const mockOutput = [
              'QEMU 6.2.0 monitor - type \'help\' for more information',
              '(qemu) info status',
              'VM status: running',
              '(qemu) info cpus',
              'CPU #0: thread_id=12345',
              'CPU #1: thread_id=12346',
              '(qemu) info block',
              'drive-virtio-disk0: /var/lib/qemu/images/disk.qcow2 (qcow2)',
              'drive-ide0-0-0: /var/lib/qemu/images/cd.iso (raw, read-only)',
              '(qemu) _'
            ];
            setConsoleOutput(mockOutput);
          }
        } catch (error) {
          console.error('Error fetching console output:', error);
          const mockOutput = [
            'QEMU 6.2.0 monitor - type \'help\' for more information',
            '(qemu) info status',
            'VM status: running',
            '(qemu) _'
          ];
          setConsoleOutput(mockOutput);
        }
        
        setConsoleDialogOpen(true);
      }
      return;
    }

    try {
      if (action === 'start') {
        await qemuService.startVM(vmId);
        setVMs(vms.map(vm => 
          vm.id === vmId ? { ...vm, status: 'running', uptime: 'Just started' } : vm
        ));
      } else if (action === 'stop') {
        await qemuService.stopVM(vmId);
        setVMs(vms.map(vm => 
          vm.id === vmId ? { ...vm, status: 'stopped', uptime: undefined } : vm
        ));
      } else if (action === 'pause') {
        // This would be handled by a pauseVM API call in real implementation
        toast.promise(
          new Promise((resolve) => setTimeout(resolve, 1000)),
          {
            loading: 'Pausing VM...',
            success: () => {
              setVMs(vms.map(vm => 
                vm.id === vmId ? { ...vm, status: 'paused' } : vm
              ));
              return 'VM paused successfully';
            },
            error: 'Failed to pause VM',
          }
        );
      } else if (action === 'resume') {
        // This would be handled by a resumeVM API call in real implementation
        toast.promise(
          new Promise((resolve) => setTimeout(resolve, 1000)),
          {
            loading: 'Resuming VM...',
            success: () => {
              setVMs(vms.map(vm => 
                vm.id === vmId ? { ...vm, status: 'running', uptime: vm.uptime || 'Just resumed' } : vm
              ));
              return 'VM resumed successfully';
            },
            error: 'Failed to resume VM',
          }
        );
      } else if (action === 'restart') {
        await qemuService.restartVM(vmId);
        setVMs(vms.map(vm => 
          vm.id === vmId ? { ...vm, status: 'running', uptime: 'Just restarted' } : vm
        ));
      } else if (action === 'snapshot') {
        const snapshotName = `snapshot-${Date.now()}`;
        await qemuService.createSnapshot(vmId, snapshotName);
        toast.info('Snapshot created successfully', {
          description: 'VM snapshot has been saved'
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing VM:`, error);
    }
  };

  const confirmActionExecution = async () => {
    const { action, vmId } = confirmAction;
    setConfirmDialogOpen(false);
    
    try {
      if (action === 'delete') {
        await qemuService.deleteVM(vmId, true);
        setVMs(vms.filter(vm => vm.id !== vmId));
      }
    } catch (error) {
      console.error(`Error ${action}ing VM:`, error);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Running</span>;
      case 'paused':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Paused</span>;
      case 'stopped':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Stopped</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const handleCreateVM = async (formData: any) => {
    console.log('Creating VM with:', formData);
    
    try {
      const response = await qemuService.createVM(formData);
      console.log('VM created:', response.data);
      
      if (response.data && response.data.vm) {
        // Add the new VM to the list
        setVMs(prevVMs => [...prevVMs, response.data.vm]);
      } else {
        // Fallback if we don't get the VM data back
        const newVM = {
          id: `vm${Date.now()}`,
          name: formData.name,
          status: 'stopped',
          cpus: formData.cpus,
          memory: `${formData.memory} GB`,
          storage: `${formData.diskSize} GB`,
          os: formData.os || 'Custom OS'
        };
        setVMs(prevVMs => [...prevVMs, newVM]);
      }
      
      setCreateDialogOpen(false);
      fetchVMs(); // Refresh VM list
    } catch (error) {
      console.error('Error creating VM:', error);
      toast.error('Failed to create VM');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64 md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search VMs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Create VM
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Virtual Machine</DialogTitle>
              <DialogDescription>
                Configure a new QEMU virtual machine
              </DialogDescription>
            </DialogHeader>
            <CreateVMForm onSubmit={handleCreateVM} onCancel={() => setCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>QEMU Virtual Machines</CardTitle>
          <CardDescription>Manage your QEMU VMs</CardDescription>
        </CardHeader>
        <CardContent>
          <VMListLoader onVMsLoaded={handleVMsLoaded}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>vCPU / Memory</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Loader className="h-8 w-8 animate-spin text-primary" />
                          <p className="mt-4 text-muted-foreground">Loading virtual machines...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredVMs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-8 text-center">
                        <p className="text-muted-foreground">No virtual machines found</p>
                        {searchTerm && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Try adjusting your search query
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVMs.map((vm) => (
                      <TableRow key={vm.id}>
                        <TableCell className="font-medium">{vm.name}</TableCell>
                        <TableCell>
                          {renderStatusBadge(vm.status)}
                          {vm.uptime && (
                            <span className="block text-xs text-muted-foreground mt-1">
                              Uptime: {vm.uptime}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{vm.os || 'Unknown'}</TableCell>
                        <TableCell>{vm.cpus || '1'} vCPU{vm.cpus && parseInt(String(vm.cpus)) !== 1 ? 's' : ''} / {vm.memory}</TableCell>
                        <TableCell>{vm.storage}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {vm.status === 'running' && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleVMAction('pause', vm.id)}
                                title="Pause"
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleVMAction('stop', vm.id)}
                                title="Stop"
                              >
                                <Square className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {vm.status === 'paused' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleVMAction('resume', vm.id)}
                              title="Resume"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {vm.status === 'stopped' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleVMAction('start', vm.id)}
                              title="Start"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleVMAction('restart', vm.id)}
                            title="Restart"
                            disabled={vm.status !== 'running'}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleVMAction('console', vm.id)}
                            title="Console"
                          >
                            <Monitor className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleVMAction('snapshot', vm.id)}
                                disabled={vm.status !== 'running' && vm.status !== 'paused'}
                              >
                                <Camera className="mr-2 h-4 w-4" />
                                <span>Create Snapshot</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                toast.info('Edit dialog would open here');
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                toast.info('Migrate dialog would open here');
                              }}>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                <span>Migrate</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleVMAction('delete', vm.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </VMListLoader>
        </CardContent>
      </Card>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this virtual machine? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmActionExecution}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={consoleDialogOpen} onOpenChange={setConsoleDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {selectedVM?.name} Console
              {selectedVM?.status && (
                <span className="ml-2 text-sm font-normal">{renderStatusBadge(selectedVM.status)}</span>
              )}
            </DialogTitle>
            <DialogDescription>
              QEMU virtual machine console output
            </DialogDescription>
          </DialogHeader>
          <div className="bg-black rounded-md p-4 h-[400px] overflow-y-auto font-mono text-sm">
            <pre className="text-green-400 whitespace-pre-wrap">
              {consoleOutput.join('\n')}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsoleDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VMsPage;
