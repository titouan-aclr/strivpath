import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ActivitiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Activities</h2>
        <p className="text-muted-foreground">View and analyze all your activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Activities list will be implemented in next steps</p>
        </CardContent>
      </Card>
    </div>
  );
}
