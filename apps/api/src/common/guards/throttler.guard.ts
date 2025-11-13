import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { GraphQLContext } from '../types';

@Injectable()
export class UnifiedThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext): { req: Request; res: Response } {
    const contextType = context.getType<'http' | 'graphql'>();

    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext<GraphQLContext>();
      return { req: ctx.req, res: ctx.res };
    }

    return {
      req: context.switchToHttp().getRequest<Request>(),
      res: context.switchToHttp().getResponse<Response>(),
    };
  }
}
