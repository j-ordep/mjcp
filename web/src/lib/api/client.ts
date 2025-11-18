const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  event_id: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Ministry {
  id: string;
  name: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// API functions
export const api = {
  volunteers: {
    getAll: () => apiClient.get<Volunteer[]>('/volunteers'),
    getById: (id: string) => apiClient.get<Volunteer>(`/volunteers/${id}`),
    create: (data: Partial<Volunteer>) => apiClient.post<Volunteer>('/volunteers', data),
    update: (id: string, data: Partial<Volunteer>) => apiClient.put<Volunteer>(`/volunteers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/volunteers/${id}`),
  },
  schedules: {
    getAll: () => apiClient.get<Schedule[]>('/schedules'),
    getById: (id: string) => apiClient.get<Schedule>(`/schedules/${id}`),
    create: (data: Partial<Schedule>) => apiClient.post<Schedule>('/schedules', data),
    update: (id: string, data: Partial<Schedule>) => apiClient.put<Schedule>(`/schedules/${id}`, data),
    delete: (id: string) => apiClient.delete(`/schedules/${id}`),
  },
  ministries: {
    getAll: () => apiClient.get<Ministry[]>('/ministries'),
    getById: (id: string) => apiClient.get<Ministry>(`/ministries/${id}`),
    create: (data: Partial<Ministry>) => apiClient.post<Ministry>('/ministries', data),
    update: (id: string, data: Partial<Ministry>) => apiClient.put<Ministry>(`/ministries/${id}`, data),
    delete: (id: string) => apiClient.delete(`/ministries/${id}`),
  },
};
