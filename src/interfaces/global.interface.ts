import { Admin, User } from '@prisma/client';

export type TSortType = 'ASC' | 'DESC';

export type TRecord = Record<string, any>;

export interface IUpdateAction {
  ids: Array<string>;
  field: {
    name: string;
    value: number | string;
  };
}

declare global {
  namespace Express {
    interface Request {
      // @ts-ignore
      user: User | Admin; // req.user can be either a User or Admin
    }
  }
}
