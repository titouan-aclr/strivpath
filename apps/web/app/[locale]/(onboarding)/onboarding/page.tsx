import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OnboardingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Your Sports</CardTitle>
        <CardDescription>Choose the sports you want to track</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Onboarding page - Sport selection will be implemented in next step</p>
      </CardContent>
    </Card>
  );
}
