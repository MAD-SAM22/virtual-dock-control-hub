import apiClient from './apiClient';
import { toast } from "sonner";

const mockVMs = [
  { id: 'v1', name: 'ubuntu-server', status: 'running', memory: '2GB', cpu: '2 cores', storage: '20GB' },
  { id: 'v2', name: 'windows-test', status: 'stopped', memory: '4GB', cpu: '4 cores', storage: '50GB' },
];

export const qemuService = {
  // Get all VMs
  getVMs: async () => {
    try {
      const res = await apiClient.get('/qemu/vms');
      return res;
    } catch (err) {
      console.warn('Failed to fetch VMs, using mock data.');
      toast.info('Fetching Data Error: Using mock VM data');
      return { data: mockVMs };
    }
  },

  // Get VM details
  getVM: async (id: string) => {
    try {
      const res = await apiClient.get(`/qemu/vms/${id}`);
      return res;
    } catch (err) {
      toast.info('Fetching Data Error: Using mock VM data');
      return { data: mockVMs.find(vm => vm.id === id) || mockVMs[0] };
    }
  },

  // Create VM
  createVM: async (data: any) => {
    return apiClient.post('/qemu/vms', data);
  },

  // Start VM
  startVM: async (id: string) => {
    return apiClient.post(`/qemu/vms/${id}/start`);
  },

  // Stop VM
  stopVM: async (id: string, force: boolean = false) => {
    return apiClient.post(`/qemu/vms/${id}/stop`, { force });
  },

  // Restart VM
  restartVM: async (id: string) => {
    return apiClient.post(`/qemu/vms/${id}/restart`);
  },

  // Create snapshot
  createSnapshot: async (id: string, name: string, description: string = '') => {
    return apiClient.post(`/qemu/vms/${id}/snapshots`, { name, description });
  },

  // List snapshots
  getSnapshots: async (id: string) => {
    return apiClient.get(`/qemu/vms/${id}/snapshots`);
  },

  // Restore snapshot
  restoreSnapshot: async (id: string, snapshotId: string) => {
    return apiClient.post(`/qemu/vms/${id}/snapshots/${snapshotId}/restore`);
  },

  // Delete snapshot
  deleteSnapshot: async (id: string, snapshotId: string) => {
    return apiClient.delete(`/qemu/vms/${id}/snapshots/${snapshotId}`);
  },

  // Migrate VM
  migrateVM: async (id: string, targetHost: string, live: boolean = true) => {
    return apiClient.post(`/qemu/vms/${id}/migrate`, { targetHost, live });
  },

  // Resize VM
  resizeVM: async (id: string, resources: any) => {
    return apiClient.put(`/qemu/vms/${id}/resize`, resources);
  },

  // Delete VM
  deleteVM: async (id: string, removeDisks: boolean = false) => {
    return apiClient.delete(`/qemu/vms/${id}`, {
      params: { removeDisks }
    });
  },

  // Get VM console
  getConsoleOutput: async (id: string, lines: number = 100) => {
    return apiClient.get(`/qemu/vms/${id}/console`, {
      params: { lines }
    });
  },

  // Get VM logs
  getVMLogs: async (id: string) => {
    return apiClient.get(`/qemu/vms/${id}/logs`);
  },

  // Get VM metrics
  getVMMetrics: async (id: string) => {
    return apiClient.get(`/qemu/vms/${id}/metrics`);
  }
};
