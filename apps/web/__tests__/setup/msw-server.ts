import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const API_PORT = process.env.API_PORT || 3011;
const WEB_PORT = process.env.PORT || 3000;
const apiURL = `http://localhost:${API_PORT}`;
const webURL = `http://localhost:${WEB_PORT}`;

const handlers = [
  http.get(`${apiURL}/api/v1/auth/strava/callback`, ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return new HttpResponse(null, {
        status: 400,
        statusText: 'Bad Request - Missing authorization code',
      });
    }

    return new HttpResponse(null, {
      status: 302,
      headers: {
        Location: `${webURL}/en/onboarding`,
        'Set-Cookie': [
          'Authentication=mock-jwt-access-token; Path=/; HttpOnly; SameSite=Lax',
          'RefreshToken=mock-jwt-refresh-token; Path=/; HttpOnly; SameSite=Lax',
        ].join(', '),
      },
    });
  }),
];

export const server = setupServer(...handlers);
