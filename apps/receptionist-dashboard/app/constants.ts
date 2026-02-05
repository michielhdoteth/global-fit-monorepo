export const API_ENDPOINTS = {
  AUTH: {
    ME: '/api/auth/me',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
  },
  CLIENTS: '/api/frontend/clients',
  CAMPAIGNS: '/api/frontend/campaigns',
  REMINDERS: '/api/frontend/reminders',
  SCHEDULE: {
    APPOINTMENTS: '/api/frontend/appointments',
    TIME_SLOTS: '/api/frontend/time-slots',
  },
  CHATS: {
    THREADS: '/api/frontend/chats/threads',
    MESSAGES: (threadId: string | number) => `/api/frontend/chats/messages?thread_id=${threadId}`,
    SEND: '/api/frontend/chats/send',
  },
  AI_AGENT: {
    STATS: '/api/frontend/ai/stats',
    CONFIGURE: '/api/frontend/ai/configure',
    DOCUMENTS: '/api/frontend/ai/documents',
  },
  DASHBOARD: '/api/dashboard/stats',
  SETTINGS: '/api/frontend/settings',
} as const;

export const DEFAULT_ADMIN_EMAIL = 'admin@globalfit.com';

export const CAMPAIGN_STATUS = {
  ACTIVE: 'Active',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  PAUSED: 'Paused',
} as const;

export const REMINDER_STATUS = {
  PENDING: 'Pending',
  READ: 'Read',
  FAILED: 'Failed',
} as const;

export const REMINDER_TYPES = {
  APPOINTMENT: 'Appointment',
  PAYMENT: 'Payment',
  FOLLOW_UP: 'Follow-up',
  MARKETING: 'Marketing',
} as const;
