import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============== CLIENTS ==============

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/frontend/clients');
      if (!res.ok) throw new Error('Failed to fetch clients');
      return res.json();
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; email: string; phone?: string; plan?: string }) => {
      const res = await fetch('/api/frontend/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create client');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/frontend/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete client');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

// ============== CAMPAIGNS ==============

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/frontend/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      return res.json();
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; type?: string; content?: string }) => {
      const res = await fetch('/api/frontend/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create campaign');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

// ============== REMINDERS ==============

export function useReminders(statusFilter?: string) {
  return useQuery({
    queryKey: ['reminders', statusFilter],
    queryFn: async () => {
      const url = statusFilter ? `/api/frontend/reminders?status_filter=${statusFilter}` : '/api/frontend/reminders';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch reminders');
      return res.json();
    },
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { client_id: number; type?: string; message: string; scheduled_time?: string }) => {
      const res = await fetch('/api/frontend/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create reminder');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });
}

// ============== CHATS ==============

export function useChatThreads() {
  return useQuery({
    queryKey: ['chat-threads'],
    queryFn: async () => {
      const res = await fetch('/api/frontend/chats/threads');
      if (!res.ok) throw new Error('Failed to fetch threads');
      return res.json();
    },
  });
}

// ============== DASHBOARD ==============

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/frontend/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });
}
