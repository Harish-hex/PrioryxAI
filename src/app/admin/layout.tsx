import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = Array.from(
  new Set(
    (process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()) : []).concat([
      'yugendhars06@gmail.com',
    ])
  )
);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    redirect('/feed');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {children}
    </div>
  );
}