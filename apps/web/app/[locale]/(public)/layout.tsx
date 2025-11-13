import { redirectIfAuthenticated } from '@/lib/auth/dal';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  await redirectIfAuthenticated();
  return <>{children}</>;
}
