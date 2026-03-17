const DEFAULT_LOCAL_API_URL = "http://localhost:8000";
const DEFAULT_PROD_API_URL = "https://medbridge-backend.vercel.app";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function resolveApiUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configured) {
    try {
      const configuredUrl = new URL(configured);
      if (typeof window !== "undefined") {
        const currentUrl = new URL(window.location.origin);
        const isSameFrontendHost = configuredUrl.hostname === currentUrl.hostname;
        const isVercelFrontend = currentUrl.hostname.endsWith("vercel.app");
        if (isSameFrontendHost && isVercelFrontend) {
          return DEFAULT_PROD_API_URL;
        }
      }
      return trimTrailingSlash(configuredUrl.origin + configuredUrl.pathname);
    } catch {
      return trimTrailingSlash(configured);
    }
  }

  if (typeof window !== "undefined" && window.location.hostname.endsWith("vercel.app")) {
    return DEFAULT_PROD_API_URL;
  }

  return DEFAULT_LOCAL_API_URL;
}

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

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
  summary: {
    total_records: number;
    connected_portals: number;
    abnormal_labs: number;
    wearable_metrics: number;
  };
  vitals: { label: string; value: string; trend: string; period: string }[];
  lab_trends: {
    glucose: { date: string; value: number; source: string }[];
    a1c: { date: string; value: number; source: string }[];
    cholesterol: { date: string; value: number; source: string }[];
  };
  care_alerts: {
    severity: string;
    title: string;
    detail: string;
  }[];
  data_coverage: {
    label: string;
    count: number;
  }[];
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
  source_system?: string | null;
  source_family?: string | null;
  source: string;
  facility?: string | null;
  provider: string;
  flags: string[];
  classification: string | null;
  ocr_status?: string | null;
  extraction_status?: string | null;
  extraction_profile?: string | null;
  extraction_targets?: string[];
  derived_records_count?: number;
  extracted_text_length?: number;
  download_url: string | null;
}

export interface DocumentUploadData {
  file: File;
  source_system: string;
  source: string;
  facility?: string;
  provider: string;
  document_date: string;
  record_type: string;
  title: string;
  extracted_text?: string;
}

export interface DocumentIntelligenceSourceSystem {
  display_name: string;
  slug: string;
  family: string;
  care_setting: string;
  focus: string[];
  likely_record_types: string[];
}

export interface DocumentIntelligenceDocumentType {
  value: string;
  label: string;
  default_targets: string[];
}

export interface DocumentIntelligenceData {
  source_systems: DocumentIntelligenceSourceSystem[];
  document_types: DocumentIntelligenceDocumentType[];
  beta_note: string;
  model_summary?: {
    generated_documents: number;
    train_documents: number;
    validation_documents: number;
    source_system_accuracy: number;
    record_type_accuracy: number;
    note: string;
  } | null;
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

export interface FHIRConnection {
  id: number;
  ehr_name: string;
  fhir_base_url: string;
  status: string;
  patient_fhir_id: string | null;
  created_at: string;
  last_synced_at: string | null;
}

export interface FhirSyncHistoryItem {
  id: number;
  connection_id: number;
  ehr_name: string;
  action: string;
  when: string;
  status: string;
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

    const doFetch = async (): Promise<Response> => {
      return fetch(`${resolveApiUrl()}${path}`, {
        ...options,
        headers: { ...headers, ...(options?.headers as Record<string, string>) },
      });
    };

    let res = await doFetch();

    // Retry once for 5xx errors after 1 second delay
    if (res.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      res = await doFetch();
    }

    if (!res.ok) {
      let detail = `Request failed: ${res.status}`;
      try {
        const body = await res.json();
        if (body.detail) {
          detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
        }
      } catch {
        const text = await res.text().catch(() => "");
        if (text) detail = text;
      }

      if (res.status === 401) {
        window.dispatchEvent(new Event("auth:expired"));
      }

      throw new ApiError(res.status, detail);
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

  async demoLogin(): Promise<AuthResponse> {
    return this.request("/api/auth/demo", {
      method: "POST",
    });
  }

  async me(): Promise<UserData> {
    return this.request("/api/auth/me");
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ status: string }> {
    return this.request("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      headers: { "Content-Type": "application/json" },
    });
  }

  // Dashboard
  async dashboard(): Promise<DashboardData> {
    return this.request("/api/dashboard");
  }

  // Records
  async records(type?: string, search?: string, skip?: number, limit?: number): Promise<RecordItem[]> {
    const params = new URLSearchParams();
    if (type && type !== "all") params.set("type", type);
    if (search) params.set("search", search);
    if (skip) params.set("skip", String(skip));
    if (limit) params.set("limit", String(limit));
    const query = params.toString() ? `?${params}` : "";
    return this.request(`/api/records${query}`);
  }

  async uploadDocument(data: DocumentUploadData): Promise<RecordItem> {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("source_system", data.source_system);
    formData.append("source", data.source);
    if (data.facility) formData.append("facility", data.facility);
    formData.append("provider", data.provider);
    formData.append("document_date", data.document_date);
    formData.append("record_type", data.record_type);
    formData.append("title", data.title);
    if (data.extracted_text) formData.append("extracted_text", data.extracted_text);

    return this.request("/api/records/documents", {
      method: "POST",
      body: formData,
    });
  }

  async documentIntelligence(): Promise<DocumentIntelligenceData> {
    return this.request("/api/records/document-intelligence");
  }

  async downloadDocument(path: string): Promise<Blob> {
    const headers: Record<string, string> = {};
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const response = await fetch(`${resolveApiUrl()}${path}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `Download failed: ${response.status}`);
    }

    return response.blob();
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

  // FHIR Integrations
  async fhirConnections(): Promise<FHIRConnection[]> {
    return this.request("/api/fhir/connections");
  }

  async fhirAuthorize(ehr: string, fhirUrl?: string): Promise<{ authorize_url: string }> {
    const params = new URLSearchParams({ ehr });
    if (fhirUrl) params.set("fhir_url", fhirUrl);
    return this.request(`/api/fhir/authorize?${params}`);
  }

  async fhirSync(connectionId: number): Promise<{ status: string; message: string }> {
    return this.request(`/api/fhir/connections/${connectionId}/sync`, { method: "POST" });
  }

  async fhirDisconnect(connectionId: number): Promise<{ status: string }> {
    return this.request(`/api/fhir/connections/${connectionId}`, { method: "DELETE" });
  }

  async fhirSyncHistory(): Promise<FhirSyncHistoryItem[]> {
    return this.request("/api/fhir/sync-history");
  }
}

export const api = new ApiClient();
