'use client';

import { useState, useEffect } from 'react';
import PageLayout from '../PageLayout';
import { Search, Plus, Filter, MoreVertical, Users, Mail, Phone, MapPin, Edit, Trash2, Eye, X, Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  plan: string;
  avatar: string;
}

export default function CRMPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    plan: '',
    status: 'PENDING',
  });
  const [deleteClientId, setDeleteClientId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/frontend/clients');
        if (!response.ok) throw new Error('Failed to fetch clients');
        const data = await response.json();
        setClients(data);
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'An error occurred',
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, [toast]);




}
