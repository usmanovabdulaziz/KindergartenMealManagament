import { useState, useEffect, useCallback, useMemo } from 'react';

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
        throw new Error(errorData.detail || errorData.error || 'Login failed');
      }

      const data = await response.json();

      setAuthState({
        token: data.access_token, // backend returns 'access_token'
        refreshToken: data.refresh_token, // backend returns 'refresh_token'
        user: {
          username: data.username,
          email: data.email,
          role: { name: data.role },
        },
        role: data.role || null,
      });

      return { success: true, user: { username: data.username, email: data.email, role: { name: data.role } } };
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

  // Refresh the user profile data
  const refreshUserProfile = useCallback(async () => {
    if (!authState.token) return;

    try {
      const userData = await fetchWithAuth('/users/profile/');
      setAuthState((prev) => ({
        ...prev,
        user: userData,
        role: userData?.role?.name || null
      }));
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
    // eslint-disable-next-line
  }, [authState.token, apiBaseUrl]);

  const refreshAuthToken = useCallback(async () => {
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

      setAuthState((prev) => ({
        ...prev,
        token: data.access // DRF SimpleJWT uses 'access'
      }));

      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      return false;
    }
    // eslint-disable-next-line
  }, [authState.refreshToken, apiBaseUrl]);

  // fetchWithAuth with safe JSON parsing for empty responses (e.g. DELETE)
  const fetchWithAuth = useCallback(
    async (
      endpoint: string,
      options: RequestInit = {}
    ) => {
      if (!authState.token) {
        throw new Error('Not authenticated');
      }

      const url = `${apiBaseUrl}${endpoint}`;

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
            headers.Authorization = `Bearer ${authState.token}`;
            response = await fetch(url, { ...options, headers });
          } else {
            throw new Error('Session expired. Please login again.');
          }
        }

        if (!response.ok) {
          // Try to parse error body if present
          let errorData = {};
          try {
            errorData = await response.json();
          } catch {
            // ignore, response body might be empty
          }
          console.error("Response error body:", errorData);
          throw new Error((errorData as any).detail || (errorData as any).error || JSON.stringify(errorData) || `Request failed with status ${response.status}`);
        }

        // --- FIX: Do not parse empty/no content as JSON ---
        if (response.status === 204) {
          return null; // No Content
        }
        const text = await response.text();
        if (!text) {
          return null;
        }
        return JSON.parse(text);

      } catch (error) {
        console.error("API request error:", error);
        throw error;
      }
    },
    [authState.token, apiBaseUrl, refreshAuthToken]
  );

  // API service methods for different resources -- memoized for stability
  const api = useMemo(() => ({
    updateCurrentUser: (data: any) => fetchWithAuth('/users/profile/', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

    updatePassword: (data: any) => fetchWithAuth('/users/password-reset/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Roles
    getRoles: () => fetchWithAuth('/users/roles/'),

    // Units
    getUnits: async () => {
      const res = await fetchWithAuth('/inventory/units/');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.results)) return res.results;
      return [];
    },
    addUnit: (data: any) => fetchWithAuth('/inventory/units/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

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

    // Product Categories
    getProductCategories: async () => {
      const res = await fetchWithAuth('/inventory/product-categories/');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.results)) return res.results;
      return [];
    },
    addProductCategory: (data: any) => fetchWithAuth('/inventory/product-categories/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateProductCategory: (id: number, data: any) => fetchWithAuth(`/inventory/product-categories/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    deleteProductCategory: (id: number) => fetchWithAuth(`/inventory/product-categories/${id}/`, {
      method: 'DELETE'
    }),

    // Low stock products
    getLowStock: () => fetchWithAuth('/inventory/products/low-stock-alerts/'),

    // Suppliers
    getSuppliers: () => fetchWithAuth('/inventory/suppliers/'),
    addSupplier: (data: any) => fetchWithAuth('/inventory/suppliers/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

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

    // Meal ingredients
    addMealIngredient: (data: any) => fetchWithAuth('/meals/meal-ingredients/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getMealIngredients: () => fetchWithAuth('/meals/meal-ingredients/'),

    // Meal servings
    getMealServings: () => fetchWithAuth('/meals/meal-servings/'),
    serveMeal: (data: any) => fetchWithAuth('/meals/meal-servings/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    // Allergens
    getAllergens: () => fetchWithAuth('/allergens/allergens/'),

    // Dashboard/Reports
    getDashboardSummary: () => fetchWithAuth('/reports/monthly-reports/dashboard/'),

    // Reports
    getMonthlyReports: () => fetchWithAuth('/reports/monthly-reports/'),

    // Ingredients Usage for Reports
    getIngredientUsage: () => fetchWithAuth('/reports/ingredients-usage/'),

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
    deleteUser: (id: number) => fetchWithAuth(`/users/users/${id}/`, {
      method: 'DELETE'
    }),

    // Logs
    getLogs: () => fetchWithAuth('/logs/logs/'),
  }), [fetchWithAuth]);

  return {
    apiBaseUrl,
    updateApiBaseUrl,
    isAuthenticated: !!authState.token,
    user: authState.user,
    userRole: authState.role,
    login,
    logout,
    refreshUserProfile,
    fetchWithAuth,
    api
  };
};