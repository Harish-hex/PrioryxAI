import { useAuthStore } from '@/stores/auth.store';

export function useAuth() {
  const { user, profile, isPro, isLoading, signOut, loadProfile, setUser, setProfile } = useAuthStore();
  return {
    user,
    profile,
    isPro,
    isLoading,
    signOut,
    loadProfile,
    setUser,
    setProfile,
    isAuthenticated: !!user,
  };
}
