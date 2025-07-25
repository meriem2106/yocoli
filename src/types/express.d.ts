import 'express';

declare module 'express' {
  interface Request {
    user?: {
      userId: string;
      email?: string;
      [key: string]: any;
    };
  }
}