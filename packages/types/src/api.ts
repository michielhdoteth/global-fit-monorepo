/**
 * API Request/Response Types
 */

// ============================================================================
// AUTH
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserResponse;
}

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

// ============================================================================
// CLIENTS
// ============================================================================

export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  plan?: string;
  planDetails?: string;
  whatsappNumber?: string;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  plan?: string;
  planDetails?: string;
  status?: string;
  notes?: string;
}

export interface ClientResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  plan?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// APPOINTMENTS
// ============================================================================

export interface CreateAppointmentRequest {
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  duration?: number;
  clientId: number;
  location?: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  duration?: number;
  status?: string;
  location?: string;
  notes?: string;
}

export interface AppointmentResponse {
  id: number;
  title: string;
  description?: string;
  date: string;
  time?: string;
  status: string;
  clientId: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CAMPAIGNS
// ============================================================================

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  type?: string; // "email", "whatsapp", "sms"
  content?: string;
  clientId: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  content?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface CampaignResponse {
  id: number;
  name: string;
  status: string;
  type?: string;
  clientId: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// AI CHAT
// ============================================================================

export interface ChatMessage {
  id?: string;
  conversationId?: string;
  sender: "client" | "agent";
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  clientId?: string;
  sessionData?: Record<string, any>;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  conversationId: string;
  sessionData?: Record<string, any>;
  metadata?: Record<string, any>;
}

// ============================================================================
// WHATSAPP
// ============================================================================

export interface SendWhatsAppRequest {
  to: string;
  message: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface SendWhatsAppResponse {
  success: boolean;
  messageId: string;
  status: string;
}

export interface WhatsAppWebhookPayload {
  messages: Array<{
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    media?: { url: string };
  }>;
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

// ============================================================================
// ERROR RESPONSE
// ============================================================================

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: string;
}

// ============================================================================
// DASHBOARD
// ============================================================================

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalClientsTrend: number;
  activeClientsTrend: number;
  pendingAppointments: number;
  todayAppointments: number;
  activeChats: number;
  pendingReminders: number;
  activeCampaigns: number;
  messagesTotal: number;
  deliveryRate: number;
  checkInsToday: number;
  botStatus: {
    connected: boolean;
    botName: string;
    lastHeartbeat?: string;
  };
}
