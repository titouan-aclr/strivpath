import { MotionProvider } from '@/components/motion-provider';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <MotionProvider>{children}</MotionProvider>;
}
