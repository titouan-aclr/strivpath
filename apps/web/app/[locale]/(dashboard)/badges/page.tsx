import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BadgesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Badges</h2>
        <p className="text-muted-foreground">Your achievements and rewards</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Badge Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Badge system will be implemented in next steps</p>
        </CardContent>
      </Card>
    </div>
  );
}
