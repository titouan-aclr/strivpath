import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { TokenPayload } from '../types';

export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext): TokenPayload => {
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext<{ req: { user: TokenPayload } }>().req.user;
});
