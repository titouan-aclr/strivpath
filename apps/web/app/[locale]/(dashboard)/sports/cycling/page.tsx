import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bike } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CyclingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bike className="h-8 w-8" />
        <div>
          <h2 className="text-3xl font-bold">Cycling</h2>
          <p className="text-muted-foreground">Your cycling statistics and progress</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cycling Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cycling-specific dashboard will be implemented in next steps</p>
        </CardContent>
      </Card>
    </div>
  );
}
