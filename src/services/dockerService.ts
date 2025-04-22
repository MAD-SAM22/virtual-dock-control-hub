
import apiClient from './apiClient';

// Docker Containers API
export const containerService = {
  // Get all containers
  getContainers: async (all: boolean = true) => {
    return apiClient.get(`/containers`, { params: { all } });
  },

  // Get container details
  getContainer: async (id: string) => {
    return apiClient.get(`/containers/${id}/json`);
  },

  // Create container
  createContainer: async (data: any) => {
    return apiClient.post('/containers/create', data);
  },

  // Start container
  startContainer: async (id: string) => {
    return apiClient.post(`/containers/${id}/start`);
  },

  // Stop container
  stopContainer: async (id: string) => {
    return apiClient.post(`/containers/${id}/stop`);
  },

  // Restart container
  restartContainer: async (id: string) => {
    return apiClient.post(`/containers/${id}/restart`);
  },

  // Kill container
  killContainer: async (id: string) => {
    return apiClient.post(`/containers/${id}/kill`);
  },

  // Pause container
  pauseContainer: async (id: string) => {
    return apiClient.post(`/containers/${id}/pause`);
  },

  // Unpause container
  unpauseContainer: async (id: string) => {
    return apiClient.post(`/containers/${id}/unpause`);
  },

  // Rename container
  renameContainer: async (id: string, name: string) => {
    return apiClient.post(`/containers/${id}/rename`, null, { params: { name } });
  },

  // Delete container
  deleteContainer: async (id: string, force: boolean = false, volumes: boolean = false) => {
    return apiClient.delete(`/containers/${id}`, { params: { force, v: volumes } });
  },

  // Get container logs
  getContainerLogs: async (id: string, follow: boolean = false, tail: string = 'all') => {
    return apiClient.get(`/containers/${id}/logs`, { 
      params: { follow, tail, stdout: true, stderr: true },
      responseType: 'text'
    });
  },

  // Get container stats
  getContainerStats: async (id: string, stream: boolean = false) => {
    return apiClient.get(`/containers/${id}/stats`, { params: { stream } });
  }
};

// Docker Images API
export const imageService = {
  // Get all images
  getImages: async (all: boolean = true) => {
    return apiClient.get(`/images/json`, { params: { all } });
  },

  // Pull image
  pullImage: async (fromImage: string, tag: string = 'latest') => {
    return apiClient.post(`/images/create`, null, { 
      params: { fromImage, tag },
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // Tag image
  tagImage: async (id: string, repo: string, tag: string) => {
    return apiClient.post(`/images/${id}/tag`, null, { params: { repo, tag } });
  },

  // Push image
  pushImage: async (name: string, tag: string = 'latest') => {
    return apiClient.post(`/images/${name}/push`, null, { 
      params: { tag },
      headers: { 'X-Registry-Auth': 'placeholder' } // This should be a proper auth token in production
    });
  },

  // Delete image
  deleteImage: async (id: string, force: boolean = false) => {
    return apiClient.delete(`/images/${id}`, { params: { force } });
  },

  // Search Docker Hub
  searchImages: async (term: string) => {
    return apiClient.get(`/images/search`, { params: { term } });
  },

  // Prune unused images
  pruneImages: async () => {
    return apiClient.post(`/images/prune`);
  }
};
