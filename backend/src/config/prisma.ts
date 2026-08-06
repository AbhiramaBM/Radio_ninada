import { PrismaClient } from '@prisma/client';
import { config } from './index';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
});
