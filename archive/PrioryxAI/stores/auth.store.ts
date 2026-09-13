import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  full_name?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  college?: string | null;
  semester?: number | null;
  cgpa?: number | null;
  github_username?: string | null;
  subscription_status?: 'free' | 'pro' | null;
  placement_score?: number | null;
  avatar_url?: string | null;
  push_token?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: any | null;
  profile: Profile | null;
  isPro: boolean;
  isLoading: boolean;
  setUser: (user: any) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isPro: false,
  isLoading: true,
  
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ 
    profile, 
    isPro: profile?.subscription_status === 'pro' 
  }),
  
  loadProfile: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { 
        set({ user: null, profile: null, isPro: false, isLoading: false }); 
        return; 
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      set({ 
        user: session.user, 
        profile: profile || null,
        isPro: profile?.subscription_status === 'pro',
        isLoading: false 
      });
    } catch {
      set({ isLoading: false });
    }
  },
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, isPro: false, isLoading: false });
  },
}));
