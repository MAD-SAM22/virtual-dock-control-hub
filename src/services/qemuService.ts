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
  customISOPath?: string;
  useCustomPath?: boolean;
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
      console.log('Fetching ISO files from API');
      const response = await apiClient.get('/qemu/list-isos');
      console.log('ISO files response:', response.data);
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
      console.log(`Uploading ISO file: ${file.name} (${file.size} bytes)`);
      
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.iso')) {
        toast.error('Only .iso files are allowed');
        throw new Error('Only .iso files are allowed.');
      }
      
      const formData = new FormData();
      formData.append('iso', file);
      
      console.log('Sending form data to /qemu/upload-iso');
      const response = await apiClient.post('/qemu/upload-iso', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Increase timeout for large files
        timeout: 3600000, // 1 hour for very large files
        // Add progress tracking for large files
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          console.log(`Upload progress: ${percentCompleted}%`);
          // You could add a toast or other UI feedback here
        },
      });
      
      console.log('Upload successful:', response.data);
      toast.success(`ISO file ${file.name} uploaded successfully`);
      return response.data.file;
    } catch (err: any) {
      console.error('Error uploading ISO file:', err);
      // Handle specific errors
      if (err.response?.status === 413) {
        toast.error('File is too large to upload. Please check server limits.');
      } else if (err.code === 'ECONNABORTED') {
        toast.error('Upload timed out. The file may be too large or the network is slow.');
      } else if (err.response?.status === 400) {
        toast.error(err.response?.data?.error || 'Invalid file format. Only .iso files are allowed.');
      } else if (err.response?.status === 500) {
        toast.error('Server error while processing the upload. Check if the server has sufficient disk space.');
      } else if (err.response?.status === 404) {
        toast.error('Upload endpoint not found. Please check server configuration.');
      } else {
        toast.error(err.response?.data?.error || err.message || 'Failed to upload ISO file');
      }
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

  // Create a new VM
  createVM: async (vmData: any) => {
    console.log('Creating VM with data:', vmData);
    
    // Format the data to match what the API expects
    const formattedData = {
      name: vmData.name,
      cpus: vmData.cpus,
      memory: vmData.memory,
      diskName: vmData.diskName || 'test-vm', // Default disk if not provided
      os: vmData.os,
      iso: vmData.iso,
      networkType: vmData.networkType || 'bridge',
      networkBridge: vmData.networkBridge,
      enableKVM: vmData.enableKVM !== undefined ? vmData.enableKVM : true,
      enableEFI: vmData.enableEFI,
      customArgs: vmData.customArgs
    };
    
    try {
      return apiClient.post('/qemu/create-vm', formattedData);
    } catch (error) {
      console.error('Error creating VM:', error);
      throw error;
    }
  },

  // Update VM
  updateVM: async (id: string, data: any) => {
    try {
      console.log(`Updating VM ${id} with data:`, data);
      const response = await apiClient.put(`/qemu/vms/${id}`, data);
      toast.success(`VM ${data.name} updated successfully`);
      return response;
    } catch (err: any) {
      console.error(`Error updating VM ${id}:`, err);
      const errorMessage = err.response?.data?.error || 'Failed to update VM';
      toast.error(errorMessage);
      throw err;
    }
  },

  // Start VM
  startVM: async (id: string) => {
    try {
      const response = await apiClient.post(`/qemu/vms/${id}/start`);
      console.log(`VM ${id} start response:`, response);
      return response;
    } catch (err) {
      console.error(`Error starting VM ${id}:`, err);
      toast.error(`Failed to start VM: ${err.message || 'Unknown error'}`);
      throw err;
    }
  },

  // Stop VM
  stopVM: async (id: string, force: boolean = false) => {
    try {
      const response = await apiClient.post(`/qemu/vms/${id}/stop`, { force });
      console.log(`VM ${id} stop response:`, response);
      return response;
    } catch (err) {
      console.error(`Error stopping VM ${id}:`, err);
      toast.error(`Failed to stop VM: ${err.message || 'Unknown error'}`);
      throw err;
    }
  },

  // Pause VM
  pauseVM: async (id: string) => {
    try {
      const response = await apiClient.post(`/qemu/vms/${id}/pause`);
      console.log(`VM ${id} pause response:`, response);
      return response;
    } catch (err) {
      console.error(`Error pausing VM ${id}:`, err);
      toast.error(`Failed to pause VM: ${err.message || 'Unknown error'}`);
      throw err;
    }
  },

  // Resume VM
  resumeVM: async (id: string) => {
    try {
      const response = await apiClient.post(`/qemu/vms/${id}/resume`);
      console.log(`VM ${id} resume response:`, response);
      return response;
    } catch (err) {
      console.error(`Error resuming VM ${id}:`, err);
      toast.error(`Failed to resume VM: ${err.message || 'Unknown error'}`);
      throw err;
    }
  },

  // Restart VM
  restartVM: async (id: string) => {
    try {
      const response = await apiClient.post(`/qemu/vms/${id}/restart`);
      console.log(`VM ${id} restart response:`, response);
      return response;
    } catch (err) {
      console.error(`Error restarting VM ${id}:`, err);
      toast.error(`Failed to restart VM: ${err.message || 'Unknown error'}`);
      throw err;
    }
  },

  // Create snapshot
  createSnapshot: async (id: string, name: string, description: string = '') => {
    try {
      const response = await apiClient.post(`/qemu/vms/${id}/snapshot`, { name, description });
      console.log(`VM ${id} snapshot response:`, response);
      return response;
    } catch (err) {
      console.error(`Error creating snapshot for VM ${id}:`, err);
      toast.error(`Failed to create snapshot: ${err.message || 'Unknown error'}`);
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
      const response = await apiClient.get(`/qemu/vms/${id}/console`, {
        params: { lines }
      });
      console.log(`VM ${id} console response:`, response);
      return response;
    } catch (err) {
      console.error(`Error fetching console for VM ${id}:`, err);
      toast.error(`Failed to fetch console output: ${err.message || 'Unknown error'}`);
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
