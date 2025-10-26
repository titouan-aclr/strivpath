import { Request } from 'express';
import { AccessTokenPayload } from '../../auth/types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AccessTokenPayload {}
  }
}

export type AuthenticatedRequest = Request & {
  user: AccessTokenPayload;
};
