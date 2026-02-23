const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  patient_id: string;
  dob: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserData;
}

export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  dob?: string;
}

export interface DashboardData {
  patient: {
    name: string;
    dob: string | null;
    patient_id: string;
    connected_portals: string[];
    wearable: string | null;
  };
  vitals: { label: string; value: string; trend: string; period: string }[];
  lab_trends: {
    glucose: { date: string; value: number; source: string }[];
    a1c: { date: string; value: number; source: string }[];
    cholesterol: { date: string; value: number; source: string }[];
  };
  recent_labs: {
    test: string;
    loinc: string;
    value: number;
    unit: string;
    range: string;
    status: string;
    date: string;
    source: string;
  }[];
  audit_log: { action: string; by: string; when: string; icon: string }[];
}

export interface RecordItem {
  id: number;
  type: string;
  title: string;
  description: string;
  date: string;
  source: string;
  provider: string;
  flags: string[];
}

export interface ProviderData {
  connected: {
    id: number;
    name: string;
    specialty: string;
    facility: string;
    portal: string;
    lastAccess: string;
    accessLevel: string;
    status: string;
  }[];
  pending: {
    id: number;
    name: string;
    specialty: string;
    facility: string;
    portal: string;
    requestedAccess: string;
    requestDate: string;
  }[];
}

export interface PortalData {
  id: number;
  name: string;
  doctors: string;
  status: string;
  color: string;
}

export interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface SettingsData {
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    dob: string | null;
    patient_id: string;
  };
  security: {
    two_factor_enabled: boolean;
    session_timeout: number;
  };
  privacy: {
    share_labs: boolean;
    share_wearable: boolean;
    allow_export: boolean;
    require_approval: boolean;
  };
  notifications: {
    notify_labs: string;
    notify_provider_requests: string;
    notify_wearable_sync: string;
    notify_weekly_summary: string;
  };
}

class ApiClient {
  private token: string | null = null;

  setToken(t: string | null) {
    this.token = t;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {};
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    if (options?.body && typeof options.body === "string" && !options.headers) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options?.headers as Record<string, string>) },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.json();
  }

  // Auth
  async signup(data: SignupData): Promise<AuthResponse> {
    return this.request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request("/api/auth/login", {
      method: "POST",
      body: new URLSearchParams({ username: email, password }).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  }

  async me(): Promise<UserData> {
    return this.request("/api/auth/me");
  }

  // Dashboard
  async dashboard(): Promise<DashboardData> {
    return this.request("/api/dashboard");
  }

  // Records
  async records(type?: string): Promise<RecordItem[]> {
    const query = type && type !== "all" ? `?type=${type}` : "";
    return this.request(`/api/records${query}`);
  }

  // Providers
  async providers(): Promise<ProviderData> {
    return this.request("/api/providers");
  }

  async approveProvider(id: number): Promise<{ status: string }> {
    return this.request(`/api/providers/${id}/approve`, { method: "POST" });
  }

  async denyProvider(id: number): Promise<{ status: string }> {
    return this.request(`/api/providers/${id}/deny`, { method: "POST" });
  }

  async revokeProvider(id: number): Promise<{ status: string }> {
    return this.request(`/api/providers/${id}/revoke`, { method: "POST" });
  }

  // Portals
  async portals(): Promise<PortalData[]> {
    return this.request("/api/portals");
  }

  async connectPortal(id: number): Promise<{ status: string; message: string }> {
    return this.request(`/api/portals/${id}/connect`, { method: "POST" });
  }

  async disconnectPortal(id: number): Promise<{ status: string }> {
    return this.request(`/api/portals/${id}/disconnect`, { method: "POST" });
  }

  // Notifications
  async notifications(): Promise<NotificationData[]> {
    return this.request("/api/notifications");
  }

  async markNotificationRead(id: number): Promise<{ status: string }> {
    return this.request(`/api/notifications/${id}/read`, { method: "PUT" });
  }

  async markAllNotificationsRead(): Promise<{ status: string }> {
    return this.request("/api/notifications/read-all", { method: "PUT" });
  }

  // Settings
  async getSettings(): Promise<SettingsData> {
    return this.request("/api/settings");
  }

  async updateSettings(data: Record<string, unknown>): Promise<{ status: string }> {
    return this.request("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
  }

  // FHIR Export
  async exportFhir(): Promise<Record<string, unknown>> {
    return this.request("/api/export/fhir");
  }

  // Audit Log
  async auditLog(): Promise<{ id: number; action: string; by: string; when: string; icon: string }[]> {
    return this.request("/api/audit-log");
  }
}

export const api = new ApiClient();
