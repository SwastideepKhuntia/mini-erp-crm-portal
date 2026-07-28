import { Role } from './enums';

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
