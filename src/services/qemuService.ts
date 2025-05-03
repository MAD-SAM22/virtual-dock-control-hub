import apiClient from './apiClient';
import { toast } from "sonner";

export interface VMInfo {
  id: string;
  name: string;
  status: string;
  memory: string;
  cpus: number | string;
  storage: string;
  os?: string;
  diskName?: string;
  diskFormat?: string;
  iso?: string | null;
  pid?: number;
  networkType?: string;
  startedAt?: string;
  uptime?: string;
}

export interface ISOFile {
  name: string;
  size: string;
  lastModified: string;
}

const mockVMs = [
  { id: 'v1', name: 'ubuntu-server', status: 'running', memory: '2GB', cpus: '2', storage: '20GB' },
  { id: 'v2', name: 'windows-test', status: 'stopped', memory: '4GB', cpus: '4', storage: '50GB' },
];

export const qemuService = {
  // Get all VMs
  getVMs: async (): Promise<{ data: VMInfo[] }> => {
    try {
      console.log('Attempting to fetch VM data from API');
      const res = await apiClient.get('/qemu/vms');
      console.log('VM API response:', res);
      
      if (res && res.data && Array.isArray(res.data)) {
        console.log('Valid VM data received from API');
        return res;
      } else {
        console.warn('Unexpected VM data format received, using mock data.');
        toast.info('Fetching Data: Using mock VM data');
        return { data: mockVMs as VMInfo[] };
      }
    } catch (err) {
      console.warn('Failed to fetch VMs, using mock data.', err);
      toast.info('Fetching Data: Using mock VM data');
      return { data: mockVMs as VMInfo[] };
    }
  },

  // Get VM details
  getVM: async (id: string): Promise<{ data: VMInfo }> => {
    try {
      console.log(`Fetching details for VM ${id}`);
      const res = await apiClient.get(`/qemu/vms/${id}`);
      console.log('VM details response:', res);
      
      if (res && res.data) {
        return res;
      } else {
        console.warn(`Unexpected VM detail format for VM ${id}, using mock data.`);
        toast.info('Fetching Data: Using mock VM details');
        const mockVM = mockVMs.find(vm => vm.id === id) || mockVMs[0];
        return { data: mockVM as VMInfo };
      }
    } catch (err) {
      console.warn(`Failed to fetch VM details for ${id}, using mock data.`, err);
      toast.info('Fetching Data: Using mock VM details');
      const mockVM = mockVMs.find(vm => vm.id === id) || mockVMs[0];
      return { data: mockVM as VMInfo };
    }
  },

  // List ISO files
  getISOFiles: async (): Promise<ISOFile[]> => {
    try {
      const response = await apiClient.get('/qemu/list-isos');
      return response.data;
    } catch (err) {
      console.error('Error fetching ISO files:', err);
      toast.error('Failed to fetch ISO files');
      return [];
    }
  },

  // Upload ISO file
  uploadISO: async (file: File): Promise<{ name: string, size: string }> => {
    try {
      const formData = new FormData();
      formData.append('iso', file);
      
      const response = await apiClient.post('/qemu/upload-iso', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      toast.success(`ISO file ${file.name} uploaded successfully`);
      return response.data.file;
    } catch (err: any) {
      console.error('Error uploading ISO file:', err);
      toast.error(err.response?.data?.error || 'Failed to upload ISO file');
      throw err;
    }
  },

  // Delete ISO file
  deleteISO: async (filename: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete(`/qemu/delete-iso/${filename}`);
      toast.success(`ISO file ${filename} deleted successfully`);
      return response.data;
    } catch (err: any) {
      console.error(`Error deleting ISO file ${filename}:`, err);
      toast.error(err.response?.data?.error || `Failed to delete ISO file ${filename}`);
      throw err;
    }
  },

  // Create VM
  createVM: async (data: any) => {
    try {
      const response = await apiClient.post('/qemu/create-vm', data);
      toast.success('VM created successfully');
      return response;
    } catch (err) {
      console.error('Error creating VM:', err);
      toast.error('Failed to create VM');
      throw err;
    }
  },

  // Start VM
  startVM: async (id: string) => {
    try {
      const response = await apiClient.post(`/qemu/vms/${id}/start`);
      toast.success(`VM ${id} started successfully`);
      return response;
    } catch (err) {
      console.error(`Error starting VM ${id}:`, err);
      toast.error(`Failed to start VM ${id}`);
      throw err;
    }
  },

  // Stop VM
  stopVM: async (id: string, force: boolean = false) => {
    try {
      const response = await apiClient.post(`/qemu/vms/${id}/stop`, { force });
      toast.success(`VM ${id} stopped successfully`);
      return response;
    } catch (err) {
      console.error(`Error stopping VM ${id}:`, err);
      toast.error(`Failed to stop VM ${id}`);
      throw err;
    }
  },

  // Restart VM
  restartVM: async (id: string) => {
    try {
      const response = await apiClient.post(`/qemu/vms/${id}/restart`);
      toast.success(`VM ${id} restarted successfully`);
      return response;
    } catch (err) {
      console.error(`Error restarting VM ${id}:`, err);
      toast.error(`Failed to restart VM ${id}`);
      throw err;
    }
  },

  // Create snapshot
  createSnapshot: async (id: string, name: string, description: string = '') => {
    try {
      const response = await apiClient.post(`/qemu/vms/${id}/snapshots`, { name, description });
      toast.success(`Snapshot created for VM ${id}`);
      return response;
    } catch (err) {
      console.error(`Error creating snapshot for VM ${id}:`, err);
      toast.error(`Failed to create snapshot for VM ${id}`);
      throw err;
    }
  },

  // List snapshots
  getSnapshots: async (id: string) => {
    try {
      return await apiClient.get(`/qemu/vms/${id}/snapshots`);
    } catch (err) {
      console.error(`Error fetching snapshots for VM ${id}:`, err);
      toast.error(`Failed to fetch snapshots for VM ${id}`);
      throw err;
    }
  },

  // Restore snapshot
  restoreSnapshot: async (id: string, snapshotId: string) => {
    try {
      const response = await apiClient.post(`/qemu/vms/${id}/snapshots/${snapshotId}/restore`);
      toast.success(`Snapshot restored for VM ${id}`);
      return response;
    } catch (err) {
      console.error(`Error restoring snapshot for VM ${id}:`, err);
      toast.error(`Failed to restore snapshot for VM ${id}`);
      throw err;
    }
  },

  // Delete snapshot
  deleteSnapshot: async (id: string, snapshotId: string) => {
    try {
      const response = await apiClient.delete(`/qemu/vms/${id}/snapshots/${snapshotId}`);
      toast.success(`Snapshot deleted for VM ${id}`);
      return response;
    } catch (err) {
      console.error(`Error deleting snapshot for VM ${id}:`, err);
      toast.error(`Failed to delete snapshot for VM ${id}`);
      throw err;
    }
  },

  // Migrate VM
  migrateVM: async (id: string, targetHost: string, live: boolean = true) => {
    try {
      const response = await apiClient.post(`/qemu/vms/${id}/migrate`, { targetHost, live });
      toast.success(`VM ${id} migration initiated`);
      return response;
    } catch (err) {
      console.error(`Error migrating VM ${id}:`, err);
      toast.error(`Failed to migrate VM ${id}`);
      throw err;
    }
  },

  // Resize VM
  resizeVM: async (id: string, resources: any) => {
    try {
      const response = await apiClient.put(`/qemu/vms/${id}/resize`, resources);
      toast.success(`VM ${id} resources updated`);
      return response;
    } catch (err) {
      console.error(`Error resizing VM ${id}:`, err);
      toast.error(`Failed to resize VM ${id}`);
      throw err;
    }
  },

  // Delete VM
  deleteVM: async (id: string, removeDisks: boolean = false) => {
    try {
      const response = await apiClient.delete(`/qemu/vms/${id}`, {
        params: { removeDisks }
      });
      toast.success(`VM ${id} deleted successfully`);
      return response;
    } catch (err) {
      console.error(`Error deleting VM ${id}:`, err);
      toast.error(`Failed to delete VM ${id}`);
      throw err;
    }
  },

  // Get VM console
  getConsoleOutput: async (id: string, lines: number = 100) => {
    try {
      return await apiClient.get(`/qemu/vms/${id}/console`, {
        params: { lines }
      });
    } catch (err) {
      console.error(`Error fetching console for VM ${id}:`, err);
      toast.error(`Failed to fetch console for VM ${id}`);
      throw err;
    }
  },

  // Get VM logs
  getVMLogs: async (id: string) => {
    try {
      return await apiClient.get(`/qemu/vms/${id}/logs`);
    } catch (err) {
      console.error(`Error fetching logs for VM ${id}:`, err);
      toast.error(`Failed to fetch logs for VM ${id}`);
      throw err;
    }
  },

  // Get VM metrics
  getVMMetrics: async (id: string) => {
    try {
      return await apiClient.get(`/qemu/vms/${id}/metrics`);
    } catch (err) {
      console.error(`Error fetching metrics for VM ${id}:`, err);
      toast.error(`Failed to fetch metrics for VM ${id}`);
      throw err;
    }
  }
};
