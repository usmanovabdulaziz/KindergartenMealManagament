
import { useState, useEffect } from 'react';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: any | null;
  role: string | null;
}

export const useApiService = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(
    localStorage.getItem('apiBaseUrl') || 'http://localhost:8000'
  );

  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedAuth = localStorage.getItem('auth');
    return savedAuth ? JSON.parse(savedAuth) : {
      token: null,
      refreshToken: null,
      user: null,
      role: null
    };
  });

  useEffect(() => {
    localStorage.setItem('auth', JSON.stringify(authState));
  }, [authState]);

  const updateApiBaseUrl = (url: string) => {
    localStorage.setItem('apiBaseUrl', url);
    setApiBaseUrl(url);
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/users/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();

      setAuthState({
        token: data.access,
        refreshToken: data.refresh,
        user: data.user,
        role: data.user?.role?.name || null
      });

      return { success: true, user: data.user };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setAuthState({
      token: null,
      refreshToken: null,
      user: null,
      role: null
    });
  };

  const refreshAuthToken = async () => {
    if (!authState.refreshToken) return false;

    try {
      const response = await fetch(`${apiBaseUrl}/users/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: authState.refreshToken }),
      });

      if (!response.ok) throw new Error('Token refresh failed');

      const data = await response.json();

      setAuthState({
        ...authState,
        token: data.access
      });

      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      return false;
    }
  };

  const fetchWithAuth = async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    if (!authState.token) {
      throw new Error('Not authenticated');
    }

    const url = `${apiBaseUrl}${endpoint}`;

    // Add authorization header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${authState.token}`,
      'Content-Type': 'application/json',
    };

    try {
      let response = await fetch(url, { ...options, headers });

      // If unauthorized, try refreshing token
      if (response.status === 401) {
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          // Retry with new token
          headers.Authorization = `Bearer ${authState.token}`;
          response = await fetch(url, { ...options, headers });
        } else {
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  };

  // API service methods for different resources
  const api = {
    // Units
    getUnits: () => fetchWithAuth('/inventory/units/'),

    // Products
    getProducts: () => fetchWithAuth('/inventory/products/'),
    getProduct: (id: number) => fetchWithAuth(`/inventory/products/${id}/`),
    addProduct: (data: any) => fetchWithAuth('/inventory/products/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateProduct: (id: number, data: any) => fetchWithAuth(`/inventory/products/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    deleteProduct: (id: number) => fetchWithAuth(`/inventory/products/${id}/`, {
      method: 'DELETE'
    }),

    // Suppliers
    getSuppliers: () => fetchWithAuth('/inventory/suppliers/'),

    // Delivery logs
    getDeliveryLogs: () => fetchWithAuth('/inventory/delivery-logs/'),
    addDelivery: (data: any) => fetchWithAuth('/inventory/delivery-logs/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Meal categories
    getMealCategories: () => fetchWithAuth('/meals/meal-categories/'),

    // Meals
    getMeals: () => fetchWithAuth('/meals/meals/'),
    getMeal: (id: number) => fetchWithAuth(`/meals/meals/${id}/`),
    addMeal: (data: any) => fetchWithAuth('/meals/meals/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateMeal: (id: number, data: any) => fetchWithAuth(`/meals/meals/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    deleteMeal: (id: number) => fetchWithAuth(`/meals/meals/${id}/`, {
      method: 'DELETE'
    }),

    // Meal servings
    getMealServings: () => fetchWithAuth('/meals/meal-servings/'),
    serveMeal: (data: any) => fetchWithAuth('/meals/meal-servings/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Meal ingredients
    getMealIngredients: () => fetchWithAuth('/meals/meal-ingredients/'),

    // Possible portions calculation
    getPossiblePortions: () => fetchWithAuth('/meals/possible-portions/'),

    // Allergens
    getAllergens: () => fetchWithAuth('/allergens/allergens/'),

    // Reports
    getMonthlyReports: () => fetchWithAuth('/reports/monthly-reports/'),

    // Users management
    getCurrentUser: () => fetchWithAuth('/users/profile/'),
    getUsers: () => fetchWithAuth('/users/users/'),
    addUser: (data: any) => fetchWithAuth('/users/users/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateUser: (id: number, data: any) => fetchWithAuth(`/users/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

    // Logs
    getLogs: () => fetchWithAuth('/users/logs/'),
  };

  return {
    apiBaseUrl,
    updateApiBaseUrl,
    isAuthenticated: !!authState.token,
    user: authState.user,
    userRole: authState.role,
    login,
    logout,
    api
  };
};