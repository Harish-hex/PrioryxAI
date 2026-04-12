import { ProfilePage } from "@/components/profile-page";

interface PublicProfilePageProps {
  params: {
    username: string;
  };
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  return (
    <main className="app-background min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <ProfilePage username={params.username} />
      </div>
    </main>
  );
}
