
import { toast } from 'sonner';
import apiClient from '../services/apiClient';

export interface ValidationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

/**
 * Utility to validate QEMU API endpoints
 */
export const qemuApiValidator = {
  /**
   * Test if the server is reachable
   */
  testConnection: async (): Promise<ValidationResult> => {
    try {
      const response = await apiClient.get('/_ping');
      return {
        success: true,
        message: 'Server is reachable',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to connect to server',
        error
      };
    }
  },

  /**
   * Test uploading an ISO file via base64
   * Note: This is an alternative method to the FormData approach in qemuService
   */
  testUploadISO: async (name: string, base64Content: string): Promise<ValidationResult> => {
    try {
      const response = await apiClient.post('/qemu/upload-iso', {
        name,
        content: base64Content
      });
      return {
        success: true,
        message: `ISO ${name} uploaded successfully`,
        data: response.data
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      return {
        success: false,
        message: `Failed to upload ISO: ${errorMessage}`,
        error
      };
    }
  },

  /**
   * Test listing available ISO files
   */
  testListISOs: async (): Promise<ValidationResult> => {
    try {
      const response = await apiClient.get('/qemu/list-isos');
      return {
        success: true,
        message: `Found ${response.data.length} ISO files`,
        data: response.data
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      return {
        success: false,
        message: `Failed to list ISOs: ${errorMessage}`,
        error
      };
    }
  },

  /**
   * Test creating a VM
   */
  testCreateVM: async (vmData: {
    name: string;
    cpus: number;
    memory: number;
    diskSize: number;
    diskFormat: string;
    iso: string;
    networkType: string;
    enableKVM: boolean;
  }): Promise<ValidationResult> => {
    try {
      const response = await apiClient.post('/qemu/create-vm', vmData);
      return {
        success: true,
        message: `VM ${vmData.name} created successfully`,
        data: response.data
      };
    } catch (error: any) {
      const statusCode = error.response?.status;
      let errorMessage = error.response?.data?.error || error.message;
      
      // Provide more helpful context based on error code
      if (statusCode === 404) {
        errorMessage = `404 Not Found: ${errorMessage} - Check if router is mounted correctly with app.use('/qemu', qemuRouter)`;
      } else if (statusCode === 400) {
        errorMessage = `400 Bad Request: ${errorMessage} - Check required parameters`;
      }
      
      return {
        success: false,
        message: `Failed to create VM: ${errorMessage}`,
        error
      };
    }
  },

  /**
   * Utility to convert a File object to base64
   */
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:application/x-iso9660-image;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  },

  /**
   * Check if QEMU is installed on the server
   */
  checkQEMUInstalled: async (): Promise<ValidationResult> => {
    try {
      // This endpoint doesn't exist by default, would need to be added to the server
      const response = await apiClient.get('/qemu/check-installation');
      return {
        success: true,
        message: 'QEMU is installed',
        data: response.data
      };
    } catch (error: any) {
      // If we get a 404, the endpoint doesn't exist which is expected
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'QEMU installation check endpoint not available',
          error
        };
      }
      
      return {
        success: false,
        message: 'Failed to check QEMU installation',
        error
      };
    }
  },

  /**
   * Run a complete validation of all endpoints
   */
  runFullValidation: async (): Promise<ValidationResult[]> => {
    const results: ValidationResult[] = [];
    
    // 1. Test connection
    const connectionResult = await qemuApiValidator.testConnection();
    results.push(connectionResult);
    
    if (!connectionResult.success) {
      toast.error('Server connection failed. Check if the server is running.');
      return results;
    }
    
    // 2. Test listing ISOs
    const listISOsResult = await qemuApiValidator.testListISOs();
    results.push(listISOsResult);
    
    // 3. Test VM creation with a sample VM (this would need a valid ISO)
    if (listISOsResult.success && listISOsResult.data && listISOsResult.data.length > 0) {
      // Try to create a VM using the first available ISO
      const sampleIso = listISOsResult.data[0].name;
      const createVMResult = await qemuApiValidator.testCreateVM({
        name: `test-vm-${Date.now()}`,
        cpus: 1,
        memory: 1,
        diskSize: 5,
        diskFormat: 'qcow2',
        iso: sampleIso,
        networkType: 'user',
        enableKVM: true
      });
      results.push(createVMResult);
    } else {
      results.push({
        success: false,
        message: 'Skipped VM creation test: No ISO files available'
      });
    }
    
    return results;
  }
};
