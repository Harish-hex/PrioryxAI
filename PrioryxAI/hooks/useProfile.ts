import { useProfileStore } from '@/stores/profile.store';
import { useAuthStore } from '@/stores/auth.store';

export function useProfile() {
  const { profile, isPro } = useAuthStore();
  const { stats, contributions, isLoadingStats, loadStats } = useProfileStore();

  return {
    profile,
    isPro,
    stats,
    contributions,
    isLoadingStats,
    loadStats,
  };
}
