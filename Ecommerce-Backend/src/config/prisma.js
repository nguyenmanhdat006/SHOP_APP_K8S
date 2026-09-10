import { PrismaClient } from "@prisma/client";

const createPrismaClient = (url) =>
  new PrismaClient({
    datasources: {
      db: { url },
    },
  });

const databaseUrl = process.env.DATABASE_URL;

const prisma = createPrismaClient(databaseUrl);

export const prismaWrite = prisma;
export const prismaRead = prisma;

export default prisma;
