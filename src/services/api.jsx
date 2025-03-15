import axios from 'axios';
import { toast } from 'react-hot-toast';

// Update API_BASE_URL to use environment variables
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? `https://${process.env.DB_HOST}`  // Changed from mysql:// to https://
  : 'http://localhost:3000/api';

// Create an Axios instance with updated config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add SSL configuration for Railway
  httpsAgent: {
    rejectUnauthorized: false
  },
  timeout: 30000, // 30 seconds timeout
});

// Initialize auth token from localStorage if available
const initializeAuthToken = () => {
  const token = localStorage.getItem('track_n_toms_auth_token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Set auth token for all future requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // You can modify the request config here before it's sent
    // For example, add a timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime(),
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx triggers this function
    // You can modify the response data here before it's passed to the application
    return response;
  },
  (error) => {
    // Any status codes outside the range of 2xx trigger this function
    // Handle common errors here
    const errorResponse = error.response;

    if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. Please try again.');
      return Promise.reject({ message: 'Request timed out' });
    }

    if (!navigator.onLine) {
      toast.error('You appear to be offline. Please check your internet connection.');
      return Promise.reject({ message: 'No internet connection' });
    }

    if (!errorResponse) {
      toast.error('Unable to connect to server. Please try again later.');
      return Promise.reject({ message: 'Network error' });
    }

    // Handle specific status codes
    switch (errorResponse.status) {
      case 400:
        // Bad request
        break;
      case 401:
        // Unauthorized - Token is invalid or expired
        // Redirect to login page if not already there
        if (window.location.pathname !== '/login') {
          toast.error('Your session has expired. Please login again.');
          
          // Clear auth data
          localStorage.removeItem('track_n_toms_auth_token');
          localStorage.removeItem('track_n_toms_auth_user');
          localStorage.removeItem('track_n_toms_auth_expiry');
          
          // Remove auth header
          delete api.defaults.headers.common['Authorization'];
          
          // Redirect to login
          window.location.href = '/login';
        }
        break;
      case 403:
        // Forbidden - User doesn't have permission
        toast.error('You do not have permission to perform this action.');
        break;
      case 404:
        // Not found
        break;
      case 422:
        // Validation errors
        break;
      case 500:
        // Server error
        toast.error('Server error. Please try again later.');
        break;
      default:
        // Other errors
        toast.error('An unexpected error occurred. Please try again later.');
    }

    // Return the error for further processing
    return Promise.reject(error);
  }
);

// Initialize auth token when this file is imported
initializeAuthToken();

// API endpoints organized by category
export const endpoints = {
  // Authentication
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    requestReset: (email) => api.post('/auth/password-reset-request', { email }),
    resetPassword: (token, newPassword) => api.post('/auth/password-reset', { token, newPassword }),
    changePassword: (data) => api.post('/auth/change-password', data),
  },
  
  // Staff
  staff: {
    getAll: (params = {}) => api.get('/staff', { params }),
    getById: (id) => api.get(`/staff/${id}`),
    create: (staffData) => api.post('/staff', staffData),
    update: (id, staffData) => api.put(`/staff/${id}`, staffData),
    delete: (id) => api.delete(`/staff/${id}`),
    updateProfile: (id, profileData) => api.put(`/staff/${id}/profile`, profileData),
    getPermissions: (id) => api.get(`/staff/${id}/permissions`),
  },
  
  // Roles
  roles: {
    getAll: () => api.get('/roles'),
    getById: (id) => api.get(`/roles/${id}`),
    create: (roleData) => api.post('/roles', roleData),
    update: (id, roleData) => api.put(`/roles/${id}`, roleData),
    delete: (id) => api.delete(`/roles/${id}`),
    getPermissions: () => api.get('/permissions'),
  },
  
  // Orders
  orders: {
    getAll: (params = {}) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    create: (orderData) => api.post('/orders', orderData),
    update: (id, orderData) => api.put(`/orders/${id}`, orderData),
    updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
    void: (id, reason) => api.post(`/orders/${id}/void`, { reason }),
    getActiveOrders: () => api.get('/orders/active'),
  },
  
  // Menu
  menu: {
    getItems: (params = {}) => api.get('/menu/items', { params }),
    getItemById: (id) => api.get(`/menu/items/${id}`),
    createItem: (itemData) => api.post('/menu/items', itemData),
    updateItem: (id, itemData) => api.put(`/menu/items/${id}`, itemData),
    deleteItem: (id) => api.delete(`/menu/items/${id}`),
    getCategories: () => api.get('/menu/categories'),
    createCategory: (categoryData) => api.post('/menu/categories', categoryData),
    updateCategory: (id, categoryData) => api.put(`/menu/categories/${id}`, categoryData),
    deleteCategory: (id) => api.delete(`/menu/categories/${id}`),
    toggleItemAvailability: (id, isAvailable) => api.patch(`/menu/items/${id}/availability`, { isAvailable }),
  },
  
  // Inventory
  inventory: {
    getIngredients: (params = {}) => api.get('/inventory/ingredients', { params }),
    getIngredientById: (id) => api.get(`/inventory/ingredients/${id}`),
    createIngredient: (data) => api.post('/inventory/ingredients', data),
    updateIngredient: (id, data) => api.put(`/inventory/ingredients/${id}`, data),
    deleteIngredient: (id) => api.delete(`/inventory/ingredients/${id}`),
    adjustStock: (id, quantity, reason) => api.post(`/inventory/ingredients/${id}/adjust`, { quantity, reason }),
    getStockHistory: (params = {}) => api.get('/inventory/stock-history', { params }),
    getLowStockItems: () => api.get('/inventory/low-stock'),
  },
  
  // Reports
  reports: {
    getSales: (params = {}) => api.get('/reports/sales', { params }),
    getInventory: (params = {}) => api.get('/reports/inventory', { params }),
    getFinancial: (params = {}) => api.get('/reports/financial', { params }),
    exportSales: (params = {}) => api.get('/reports/sales/export', { params, responseType: 'blob' }),
    exportInventory: (params = {}) => api.get('/reports/inventory/export', { params, responseType: 'blob' }),
    exportFinancial: (params = {}) => api.get('/reports/financial/export', { params, responseType: 'blob' }),
  },
  
  // Settings
  settings: {
    getAll: () => api.get('/settings'),
    update: (settings) => api.put('/settings', settings),
    getStoreInfo: () => api.get('/settings/store'),
    updateStoreInfo: (data) => api.put('/settings/store', data),
    getTaxSettings: () => api.get('/settings/tax'),
    updateTaxSettings: (data) => api.put('/settings/tax', data),
  },
  
  // Dashboard
  dashboard: {
    getSummary: () => api.get('/dashboard/summary'),
    getSalesChart: (period = 'week') => api.get(`/dashboard/sales-chart?period=${period}`),
    getTopProducts: (limit = 5) => api.get(`/dashboard/top-products?limit=${limit}`),
    getInventoryAlerts: () => api.get('/dashboard/inventory-alerts'),
  }
};

// Utility function to handle file uploads
export const uploadFile = async (url, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Utility function to download a file
export const downloadFile = async (url, filename, params = {}) => {
  try {
    const response = await api.get(url, {
      params,
      responseType: 'blob',
    });
    
    // Create a URL for the blob
    const blob = new Blob([response.data]);
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    toast.error('Failed to download file');
    throw error;
  }
};

// Export default API instance for direct use
export default api;