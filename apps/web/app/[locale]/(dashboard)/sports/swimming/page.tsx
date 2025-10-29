import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Waves } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SwimmingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Waves className="h-8 w-8" />
        <div>
          <h2 className="text-3xl font-bold">Swimming</h2>
          <p className="text-muted-foreground">Your swimming statistics and progress</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Swimming Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Swimming-specific dashboard will be implemented in next steps</p>
        </CardContent>
      </Card>
    </div>
  );
}
