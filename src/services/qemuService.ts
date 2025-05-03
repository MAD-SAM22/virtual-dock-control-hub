
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

export const qemuService = {
  // Get all VMs
  getVMs: async (): Promise<{ data: VMInfo[] }> => {
    try {
      console.log('Attempting to fetch VM data from API');
      const res = await apiClient.get('/qemu/vms');
      console.log('VM API response:', res);
      return res;
    } catch (err) {
      console.warn('Failed to fetch VMs', err);
      toast.error('Failed to fetch VMs');
      throw err;
    }
  },

  // Get VM details
  getVM: async (id: string): Promise<{ data: VMInfo }> => {
    try {
      console.log(`Fetching details for VM ${id}`);
      const res = await apiClient.get(`/qemu/vms/${id}`);
      console.log('VM details response:', res);
      return res;
    } catch (err) {
      console.warn(`Failed to fetch VM details for ${id}`, err);
      toast.error(`Failed to fetch VM details`);
      throw err;
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
      return response;
    } catch (err) {
      console.error('Error creating VM:', err);
      throw err;
    }
  },

  // Start VM
  startVM: async (id: string) => {
    try {
      return await apiClient.post(`/qemu/vms/${id}/start`);
    } catch (err) {
      console.error(`Error starting VM ${id}:`, err);
      throw err;
    }
  },

  // Stop VM
  stopVM: async (id: string, force: boolean = false) => {
    try {
      return await apiClient.post(`/qemu/vms/${id}/stop`, { force });
    } catch (err) {
      console.error(`Error stopping VM ${id}:`, err);
      throw err;
    }
  },

  // Pause VM
  pauseVM: async (id: string) => {
    try {
      return await apiClient.post(`/qemu/vms/${id}/pause`);
    } catch (err) {
      console.error(`Error pausing VM ${id}:`, err);
      throw err;
    }
  },

  // Resume VM
  resumeVM: async (id: string) => {
    try {
      return await apiClient.post(`/qemu/vms/${id}/resume`);
    } catch (err) {
      console.error(`Error resuming VM ${id}:`, err);
      throw err;
    }
  },

  // Restart VM
  restartVM: async (id: string) => {
    try {
      return await apiClient.post(`/qemu/vms/${id}/restart`);
    } catch (err) {
      console.error(`Error restarting VM ${id}:`, err);
      throw err;
    }
  },

  // Create snapshot
  createSnapshot: async (id: string, name: string, description: string = '') => {
    try {
      return await apiClient.post(`/qemu/vms/${id}/snapshot`, { name, description });
    } catch (err) {
      console.error(`Error creating snapshot for VM ${id}:`, err);
      throw err;
    }
  },

  // Delete VM
  deleteVM: async (id: string, removeDisks: boolean = false) => {
    try {
      return await apiClient.delete(`/qemu/vms/${id}`, {
        params: { removeDisks }
      });
    } catch (err) {
      console.error(`Error deleting VM ${id}:`, err);
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
      throw err;
    }
  },

  // Get VM logs
  getVMLogs: async (id: string) => {
    try {
      return await apiClient.get(`/qemu/vms/${id}/logs`);
    } catch (err) {
      console.error(`Error fetching logs for VM ${id}:`, err);
      throw err;
    }
  },

  // Get VM metrics
  getVMMetrics: async (id: string) => {
    try {
      return await apiClient.get(`/qemu/vms/${id}/metrics`);
    } catch (err) {
      console.error(`Error fetching metrics for VM ${id}:`, err);
      throw err;
    }
  }
};
