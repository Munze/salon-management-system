import { Prisma } from '@prisma/client';

export type QueryMode = 'default' | 'insensitive';

export interface StringFilter {
  equals?: string;
  in?: string[];
  notIn?: string[];
  lt?: string;
  lte?: string;
  gt?: string;
  gte?: string;
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  mode?: QueryMode;
  not?: string | StringFilter;
}

declare global {
  namespace PrismaNamespace {
    interface UserWhereInput {
      OR?: UserWhereInput[];
      name?: string | StringFilter;
      email?: string | StringFilter;
      salonId?: string;
    }
  }
}
