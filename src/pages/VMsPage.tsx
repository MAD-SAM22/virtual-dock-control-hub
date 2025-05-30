import { useState, useRef } from 'react';
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
import CreateVMForm from '@/components/vms/CreateVMForm';
import VMListLoader, { VMListLoaderRef } from '@/components/vms/VMListLoader';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ action: '', vmId: '' });
  const [consoleDialogOpen, setConsoleDialogOpen] = useState(false);
  const [selectedVM, setSelectedVM] = useState<VMInfo | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0); 
  const [isEditMode, setIsEditMode] = useState(false);
  const vmLoaderRef = useRef<VMListLoaderRef>(null);

  const handleVMsLoaded = (loadedVMs: VMInfo[]) => {
    console.log('VMs loaded in page component:', loadedVMs);
    setVMs(loadedVMs);
    setFilteredVMs(loadedVMs);
    setIsLoading(false);
  };

  const triggerRefresh = () => {
    console.log('Triggering VM list refresh');
    setIsLoading(true);
    setRefetchTrigger(prev => prev + 1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredVMs(vms);
    } else {
      const filtered = vms.filter(
        vm => 
          vm.name?.toLowerCase().includes(term.toLowerCase()) ||
          (vm.os?.toLowerCase().includes(term.toLowerCase()) || false) ||
          (vm.id?.toLowerCase().includes(term.toLowerCase()) || false)
      );
      setFilteredVMs(filtered);
    }
  };

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
          const consoleData = await qemuService.getConsoleOutput(vmId);
          if (consoleData && consoleData.data) {
            setConsoleOutput(Array.isArray(consoleData.data) ? consoleData.data : [consoleData.data.toString()]);
          } else {
            setConsoleOutput(['No console output available']);
          }
        } catch (error) {
          console.error('Error fetching console output:', error);
          setConsoleOutput(['Failed to fetch console output']);
        }
        
        setConsoleDialogOpen(true);
      }
      return;
    }

    if (action === 'edit') {
      try {
        console.log(`Fetching details for VM ${vmId} to edit`);
        const vmResponse = await qemuService.getVM(vmId);
        const vmToEdit = vmResponse.data;
        
        console.log('VM data for edit:', vmToEdit);
        setSelectedVM(vmToEdit);
        setIsEditMode(true);
        setCreateDialogOpen(true);
      } catch (error) {
        console.error(`Error fetching VM ${vmId} for editing:`, error);
        toast.error(`Failed to load VM details for editing`);
      }
      return;
    }

    try {
      if (action === 'start') {
        await qemuService.startVM(vmId);
        toast.success(`VM started successfully`);
      } else if (action === 'stop') {
        await qemuService.stopVM(vmId);
        toast.success(`VM stopped successfully`);
      } else if (action === 'pause') {
        await qemuService.pauseVM(vmId);
        toast.success(`VM paused successfully`);
      } else if (action === 'resume') {
        await qemuService.resumeVM(vmId);
        toast.success(`VM resumed successfully`);
      } else if (action === 'restart') {
        await qemuService.restartVM(vmId);
        toast.success(`VM restarted successfully`);
      } else if (action === 'snapshot') {
        const snapshotName = `snapshot-${Date.now()}`;
        await qemuService.createSnapshot(vmId, snapshotName);
        toast.success(`Snapshot created successfully`);
      } else if (action === 'migrate') {
        toast.info('VM migration functionality coming soon');
      }
      
      // Trigger VM list refresh after action
      triggerRefresh();
    } catch (error) {
      console.error(`Error ${action}ing VM:`, error);
      toast.error(`Failed to ${action} VM`);
    }
  };

  const confirmActionExecution = async () => {
    const { action, vmId } = confirmAction;
    setConfirmDialogOpen(false);
    
    try {
      if (action === 'delete') {
        await qemuService.deleteVM(vmId, true);
        toast.success(`VM deleted successfully`);
        triggerRefresh(); // Use the trigger refresh instead of fetchVMs
      }
    } catch (error) {
      console.error(`Error ${action}ing VM:`, error);
      toast.error(`Failed to ${action} VM`);
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
      // Ensure all required fields are present
      if (!formData.name || !formData.cpus || !formData.memory || !formData.diskName) {
        toast.error('Missing required VM parameters');
        return;
      }
      
      const response = await qemuService.createVM(formData);
      console.log('VM created:', response.data);
      
      setCreateDialogOpen(false);
      toast.success('VM created successfully');
      triggerRefresh();
      
      // Reset edit mode
      setIsEditMode(false);
      setSelectedVM(null);
    } catch (error: any) {
      console.error('Error creating VM:', error);
      toast.error(`Failed to create VM: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUpdateVM = async (formData: any) => {
    if (!selectedVM) return;
    
    console.log('Updating VM with:', formData);
    
    try {
      const response = await qemuService.updateVM(selectedVM.id, formData);
      console.log('VM updated:', response.data);
      
      setCreateDialogOpen(false);
      toast.success('VM updated successfully');
      triggerRefresh();
      
      // Reset edit mode
      setIsEditMode(false);
      setSelectedVM(null);
    } catch (error) {
      console.error('Error updating VM:', error);
      toast.error('Failed to update VM');
    }
  };

  const handleDialogClose = () => {
    setCreateDialogOpen(false);
    setIsEditMode(false);
    setSelectedVM(null);
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
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={triggerRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => {
              console.log("Create VM button clicked");
              setIsEditMode(false);
              setSelectedVM(null);
              setCreateDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Create VM
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>QEMU Virtual Machines</CardTitle>
          <CardDescription>Manage your QEMU VMs</CardDescription>
        </CardHeader>
        <CardContent>
          <VMListLoader 
            onVMsLoaded={handleVMsLoaded} 
            refetchTrigger={refetchTrigger}
            ref={vmLoaderRef}
          >
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
                  {filteredVMs.length === 0 ? (
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
                              <DropdownMenuItem onClick={() => handleVMAction('edit', vm.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleVMAction('migrate', vm.id)}>
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Virtual Machine' : 'Create Virtual Machine'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Modify' : 'Configure'} a QEMU virtual machine
            </DialogDescription>
          </DialogHeader>
          <CreateVMForm 
            onSubmit={isEditMode ? handleUpdateVM : handleCreateVM} 
            onCancel={handleDialogClose} 
            initialValues={selectedVM}
            isEditMode={isEditMode}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VMsPage;
