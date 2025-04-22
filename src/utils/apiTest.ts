
import apiClient from '../services/apiClient';
import { toast } from 'sonner';

export const testApiConnection = async () => {
  try {
    console.log('Testing API connection to:', import.meta.env.VITE_API_URL);
    const response = await apiClient.get('/health');
    console.log('API response:', response.data);
    toast.success('API connection successful!');
    return response.data;
  } catch (error) {
    console.error('API connection failed:', error);
    toast.error('API connection failed. Check console for details.');
    throw error;
  }
};
