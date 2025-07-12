const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to make API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      statusText: response.statusText,
      data: errorData,
      response: { data: errorData }
    };
  }

  return response.json();
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string, confirmPassword: string, username: string, full_name: string) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, confirmPassword, username, full_name }),
    });
  },

  login: async (email: string, password: string) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async (token: string) => {
    return apiCall('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  getMe: async (token: string) => {
    return apiCall('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  forgotPassword: async (email: string) => {
    return apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, newPassword: string, confirmPassword: string) => {
    return apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    });
  },

  changePassword: async (token: string, currentPassword: string, newPassword: string, confirmPassword: string) => {
    return apiCall('/auth/change-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
  },
};

// Items API
export const itemsAPI = {
  getAll: async (params?: { category?: string; search?: string; sort?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/items?${queryString}` : '/items';
    return apiCall(endpoint);
  },

  getById: async (id: string) => {
    return apiCall(`/items/${id}`);
  },

  create: async (itemData: FormData, token: string) => {
    const url = `${API_BASE_URL}/items`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: itemData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
        response: { data: errorData }
      };
    }

    return response.json();
  },

  update: async (id: string, itemData: any, token: string) => {
    return apiCall(`/items/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(itemData),
    });
  },

  delete: async (id: string, token: string) => {
    return apiCall(`/items/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  approve: async (id: string, token: string) => {
    return apiCall(`/items/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  reject: async (id: string, token: string) => {
    return apiCall(`/items/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  like: async (id: string, token: string) => {
    return apiCall(`/items/${id}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  unlike: async (id: string, token: string) => {
    return apiCall(`/items/${id}/like`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// Admin API
export const adminAPI = {
  // Items management
  getPendingItems: async (token: string) => {
    return apiCall('/admin/items/pending', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  approveItem: async (itemId: string, token: string) => {
    return apiCall(`/admin/items/${itemId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  rejectItem: async (itemId: string, reason: string, token: string) => {
    return apiCall(`/admin/items/${itemId}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
  },

  removeItem: async (itemId: string, reason: string, token: string) => {
    return apiCall(`/admin/items/${itemId}/remove`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
  },

  // Users management
  getUsers: async (params: { page?: number; limit?: number; search?: string }, token: string) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
    
    return apiCall(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  banUser: async (userId: string, banned: boolean, reason: string, token: string) => {
    return apiCall(`/admin/users/${userId}/ban`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ banned, reason }),
    });
  },

  adjustUserPoints: async (userId: string, points: number, reason: string, token: string) => {
    return apiCall(`/admin/users/${userId}/points`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ points, reason }),
    });
  },

  // Stats
  getStats: async (token: string) => {
    return apiCall('/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// Users API
export const usersAPI = {
  getProfile: async (token: string) => {
    return apiCall('/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  updateProfile: async (userData: any, token: string) => {
    return apiCall('/users/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
  },

  getUserItems: async (userId: string, token: string) => {
    return apiCall(`/users/${userId}/items`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Dashboard-specific endpoints
  getDashboard: async (token: string) => {
    return apiCall('/users/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  getItems: async (token: string) => {
    return apiCall('/users/items', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  getIncomingSwaps: async (token: string) => {
    return apiCall('/users/swaps/incoming', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  getOutgoingSwaps: async (token: string) => {
    return apiCall('/users/swaps/outgoing', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  getCompletedSwaps: async (token: string) => {
    return apiCall('/users/swaps/completed', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  getStats: async (userId: string) => {
    return apiCall(`/users/${userId}/stats`);
  },
};

// Swaps API
export const swapsAPI = {
  create: async (swapData: any, token: string) => {
    return apiCall('/swaps', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(swapData),
    });
  },

  getAll: async (token: string) => {
    return apiCall('/swaps', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  getById: async (id: string, token: string) => {
    return apiCall(`/swaps/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  accept: async (id: string, token: string) => {
    return apiCall(`/swaps/${id}/accept`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  reject: async (id: string, token: string) => {
    return apiCall(`/swaps/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  complete: async (id: string, token: string) => {
    return apiCall(`/swaps/${id}/complete`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    return apiCall('/health');
  },
}; 