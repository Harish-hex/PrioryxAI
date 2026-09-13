import { supabase } from './supabase';
import { API_BASE } from '@/constants/api';

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${formattedEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(session?.access_token 
      ? { 'Authorization': `Bearer ${session.access_token}` } 
      : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || `HTTP error ${response.status}`);
  }

  return response.json();
}
