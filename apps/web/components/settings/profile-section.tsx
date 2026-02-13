'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/context';
import { Calendar, ExternalLink, MapPin, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export function ProfileSection() {
  const t = useTranslations('settings.profile');
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ') || user.username || 'Athlete';
  const initials = `${user.firstname?.[0] ?? ''}${user.lastname?.[0] ?? ''}`.toUpperCase() || '?';
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" aria-hidden="true" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.profile || user.profileMedium || undefined} alt={fullName} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="text-lg font-semibold">{fullName}</h3>
              {user.username && (
                <a
                  href={`https://www.strava.com/athletes/${user.stravaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  @{user.username}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
                <Image src="/strava-icon.svg" alt="" width={12} height={12} aria-hidden="true" />
                {t('connectedVia')}
              </Badge>
              {user.city && (
                <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {[user.city, user.country].filter(Boolean).join(', ')}
                </Badge>
              )}
              {memberSince && (
                <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  {t('memberSince')}: {memberSince}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
