import { Request } from 'express';
import { User } from '@repo/graphql-types';

export interface AuthenticatedRequest extends Request {
  user: User;
}
