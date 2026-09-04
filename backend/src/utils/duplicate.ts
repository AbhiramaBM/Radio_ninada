import { prisma } from '../config/prisma';

export async function checkDuplicateProgram(name: string, excludeId?: string) {
  const existing = await prisma.program.findFirst({
    where: {
      name: { equals: name },
      deletedAt: null,
      NOT: excludeId ? { id: excludeId } : undefined,
    },
  });
  return existing !== null;
}

export async function checkDuplicatePodcast(title: string, excludeId?: string) {
  const existing = await prisma.podcast.findFirst({
    where: {
      title: { equals: title },
      deletedAt: null,
      NOT: excludeId ? { id: excludeId } : undefined,
    },
  });
  return existing !== null;
}

export async function checkDuplicateNews(title: string, excludeId?: string) {
  const existing = await prisma.news.findFirst({
    where: {
      title: { equals: title },
      deletedAt: null,
      NOT: excludeId ? { id: excludeId } : undefined,
    },
  });
  return existing !== null;
}

export async function checkDuplicateEvent(title: string, eventDate: Date, excludeId?: string) {
  const existing = await prisma.event.findFirst({
    where: {
      title: { equals: title },
      deletedAt: null,
      NOT: excludeId ? { id: excludeId } : undefined,
    },
  });
  return existing !== null;
}
