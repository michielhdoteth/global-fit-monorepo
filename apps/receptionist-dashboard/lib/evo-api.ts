/**
 * EVO Gym Software API Client
 * ABC Fitness Solutions (EVO) Integration
 * Docs: https://evo-integracao.w12app.com.br/swagger/index.html
 *
 * Authentication: Basic Auth
 * - Username: Gym's DNS
 * - Password: Secret Key (API Key)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface EvoAuthConfig {
  dns: string;
  apiKey: string;
  branchId?: string;
}

export interface EvoMember {
  idMember: number;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  status?: string;
  idBranch?: number;
  birthDate?: string;
  gender?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EvoMembership {
  idMemberMembership: number;
  idMember: number;
  idMembership?: number;
  status: string;
  startDate: string;
  endDate?: string;
  cancellationDate?: string;
  description?: string;
  price?: number;
}

export interface EvoVisit {
  idEntry?: number;
  idMember: number;
  entryDate: string;
  entryTime?: string;
  idBranch?: number;
  turnstile?: string;
}

export interface EvoReceivable {
  idReceivable: number;
  idMember: number;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: string;
  description?: string;
}

export interface EvoClientData {
  member: EvoMember | null;
  memberships: EvoMembership[];
  visits: EvoVisit[];
  receivables: EvoReceivable[];
}

// ============================================================================
// CLIENT CLASS
// ============================================================================

class EvoClient {
  private config: EvoAuthConfig;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: EvoAuthConfig) {
    this.config = config;
    this.baseUrl = config.dns.replace(/\/$/, "");
    this.authHeader = this.createAuthHeader(config.dns, config.apiKey);
  }

  private createAuthHeader(dns: string, apiKey: string): string {
    // EVO uses Basic Authentication with DNS as username and API key as password
    // We need to extract just the hostname from the DNS for the username
    const url = new URL(dns);
    const username = url.hostname;
    const credentials = btoa(`${username}:${apiKey}`);
    return `Basic ${credentials}`;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T | null> {
    try {
      console.log(`[EVO_CLIENT] Requesting: ${this.baseUrl}${endpoint}`);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: this.authHeader,
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[EVO_CLIENT] API error ${response.status}:`, errorText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`[EVO_CLIENT] Request error:`, error);
      return null;
    }
  }

  /**
   * Test connection to EVO API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.request<any>("/api/v1/configuration");
      if (result) {
        return { success: true, message: "Connection successful" };
      }
      return { success: false, message: "Failed to authenticate" };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  /**
   * Get all members (paginated)
   * GET /api/v2/members
   */
  async getMembers(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<EvoMember[] | null> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());
    if (params?.status) queryParams.append("status", params.status);

    const endpoint = `/api/v2/members${queryParams.toString() ? `?${queryParams}` : ""}`;
    const result = await this.request<any>(endpoint);

    if (result?.items) {
      return result.items;
    }
    return result || null;
  }

  /**
   * Get member by ID
   * GET /api/v2/members/{idMember}
   */
  async getMember(idMember: number): Promise<EvoMember | null> {
    return this.request<EvoMember>(`/api/v2/members/${idMember}`);
  }

  /**
   * Get active members from a branch
   * GET /api/v1/members/active-members
   */
  async getActiveMembers(idBranch?: number): Promise<EvoMember[] | null> {
    const endpoint = idBranch
      ? `/api/v1/members/active-members?idBranch=${idBranch}`
      : "/api/v1/members/active-members";
    return this.request<EvoMember[]>(endpoint);
  }

  /**
   * Get basic member information
   * GET /api/v1/members/basic
   */
  async getMemberBasic(idMember: number): Promise<EvoMember | null> {
    return this.request<EvoMember>(`/api/v1/members/basic?idMember=${idMember}`);
  }

  /**
   * Get member services
   * GET /api/v1/members/services
   */
  async getMemberServices(idMember: number): Promise<EvoMembership[] | null> {
    return this.request<EvoMembership[]>(
      `/api/v1/members/services?idMember=${idMember}`
    );
  }

  /**
   * Get memberships
   * GET /api/v2/membership
   */
  async getMemberships(params?: {
    page?: number;
    pageSize?: number;
    idMember?: number;
  }): Promise<EvoMembership[] | null> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());
    if (params?.idMember) queryParams.append("idMember", params.idMember.toString());

    const endpoint = `/api/v2/membership${queryParams.toString() ? `?${queryParams}` : ""}`;
    const result = await this.request<any>(endpoint);

    if (result?.items) {
      return result.items;
    }
    return result || null;
  }

  /**
   * Get membership details by ID
   * GET /api/v1/membermembership/{idMemberMembership}
   */
  async getMembership(idMemberMembership: number): Promise<EvoMembership | null> {
    return this.request<EvoMembership>(
      `/api/v1/membermembership/${idMemberMembership}`
    );
  }

  /**
   * Get entries (visits/check-ins)
   * GET /api/v1/entries
   */
  async getEntries(params?: {
    idMember?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<EvoVisit[] | null> {
    const queryParams = new URLSearchParams();
    if (params?.idMember) queryParams.append("idMember", params.idMember.toString());
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());

    const endpoint = `/api/v1/entries${queryParams.toString() ? `?${queryParams}` : ""}`;
    const result = await this.request<any>(endpoint);

    if (result?.items) {
      return result.items;
    }
    return result || null;
  }

  /**
   * Get receivables (payments/invoices)
   * GET /api/v1/receivables
   */
  async getReceivables(params?: {
    idMember?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<EvoReceivable[] | null> {
    const queryParams = new URLSearchParams();
    if (params?.idMember) queryParams.append("idMember", params.idMember.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());

    const endpoint = `/api/v1/receivables${queryParams.toString() ? `?${queryParams}` : ""}`;
    const result = await this.request<any>(endpoint);

    if (result?.items) {
      return result.items;
    }
    return result || null;
  }

  /**
   * Get debtors list (members with unpaid debts)
   * GET /api/v1/receivables/debtors
   */
  async getDebtors(): Promise<any[] | null> {
    return this.request<any[]>("/api/v1/receivables/debtors");
  }

  /**
   * Get sales
   * GET /api/v2/sales
   */
  async getSales(params?: {
    idMember?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<any[] | null> {
    const queryParams = new URLSearchParams();
    if (params?.idMember) queryParams.append("idMember", params.idMember.toString());
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());

    const endpoint = `/api/v2/sales${queryParams.toString() ? `?${queryParams}` : ""}`;
    const result = await this.request<any>(endpoint);

    if (result?.items) {
      return result.items;
    }
    return result || null;
  }

  /**
   * Get all client data in a single call
   * Useful for syncing a member's complete profile
   */
  async getClientData(idMember: number): Promise<EvoClientData> {
    const [member, memberships, visits, receivables] = await Promise.all([
      this.getMember(idMember),
      this.getMemberServices(idMember),
      this.getEntries({ idMember }),
      this.getReceivables({ idMember }),
    ]);

    return {
      member: member || null,
      memberships: memberships || [],
      visits: visits || [],
      receivables: receivables || [],
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

let evoInstance: EvoClient | null = null;

export function createEvoClient(config: EvoAuthConfig): EvoClient {
  return new EvoClient(config);
}

export async function getEvoClientFromDb(): Promise<EvoClient | null> {
  const prisma = (await import("@/lib/db")).default;
  const settings = await prisma.evoSettings.findFirst();

  if (!settings || !settings.dns || !settings.apiKey) {
    console.error("[EVO_CLIENT] No valid configuration found in database");
    return null;
  }

  if (!settings.isEnabled) {
    console.warn("[EVO_CLIENT] EVO integration is disabled");
    return null;
  }

  return new EvoClient({
    dns: settings.dns,
    apiKey: settings.apiKey,
    branchId: settings.branchId || undefined,
  });
}

export default EvoClient;
