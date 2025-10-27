import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SyncPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Syncing Your Activities</CardTitle>
        <CardDescription>Please wait while we import your Strava activities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={33} />
        <p className="text-center text-sm text-muted-foreground">Activity sync page will be implemented in next step</p>
      </CardContent>
    </Card>
  );
}
