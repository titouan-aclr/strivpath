import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Request {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ req: Request }>().req;
  }

  handleRequest<TUser = unknown>(err: Error | null, user: TUser | false, info: Error | null): TUser {
    if (err || !user) {
      console.warn('[Backend GQL Guard] Authentication failed', {
        error: err?.message || info?.message || 'Unknown',
      });

      throw err || new UnauthorizedException('Authentication required');
    }

    return user;
  }
}
