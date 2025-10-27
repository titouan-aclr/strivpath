import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ActivityDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Activity Details</h2>
        <p className="text-muted-foreground">Activity ID: {id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Activity detail page will be implemented in next steps</p>
        </CardContent>
      </Card>
    </div>
  );
}
