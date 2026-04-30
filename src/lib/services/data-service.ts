import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
  });
}

export async function getUserModules(userId: string) {
  return prisma.module.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { sources: true, essays: true },
      },
    },
  });
}

export async function getModuleById(userId: string, moduleId: string) {
  return prisma.module.findFirst({
    where: { id: moduleId, userId },
    include: {
      folders: { orderBy: { displayOrder: "asc" } },
      _count: {
        select: { sources: true, essays: true },
      },
    },
  });
}

export async function getModuleFolders(moduleId: string) {
  return prisma.folder.findMany({
    where: { moduleId },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getFolderSources(folderId: string) {
  return prisma.source.findMany({
    where: { folderId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getModuleSources(moduleId: string) {
  return prisma.source.findMany({
    where: { moduleId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserSources(userId: string) {
  return prisma.source.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { module: { select: { title: true, code: true } } },
  });
}

export async function getSourceById(userId: string, sourceId: string) {
  return prisma.source.findFirst({
    where: { id: sourceId, userId },
    include: {
      module: { select: { title: true, code: true } },
      chunks: { orderBy: { chunkIndex: "asc" } },
    },
  });
}

export async function getSourceChunks(sourceId: string) {
  return prisma.sourceChunk.findMany({
    where: { sourceId },
    orderBy: { chunkIndex: "asc" },
  });
}

export async function getUserEssays(userId: string) {
  return prisma.essay.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { module: { select: { title: true, code: true } } },
  });
}

export async function getEssaysByModule(userId: string, moduleId: string) {
  return prisma.essay.findMany({
    where: { userId, moduleId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getEssayById(userId: string, essayId: string) {
  return prisma.essay.findFirst({
    where: { id: essayId, userId },
    include: {
      module: { select: { title: true, code: true } },
      sections: { orderBy: { displayOrder: "asc" } },
      evidence: {
        include: {
          source: { select: { title: true, authors: true, year: true } },
          sourceChunk: { select: { text: true } },
        },
      },
    },
  });
}

export async function createEssay(
  userId: string,
  data: {
    moduleId: string;
    title: string;
    question?: string;
    thesis?: string;
    targetWordCount?: number;
  }
) {
  return prisma.essay.create({
    data: { ...data, userId },
  });
}

export async function updateEssay(
  userId: string,
  essayId: string,
  data: {
    title?: string;
    question?: string;
    thesis?: string;
    targetWordCount?: number;
    status?: string;
  }
) {
  return prisma.essay.update({
    where: { id: essayId },
    data,
  });
}

export async function createEssaySection(
  userId: string,
  essayId: string,
  data: {
    title: string;
    purpose?: string;
    targetWordCount?: number;
    displayOrder?: number;
    notes?: string;
  }
) {
  return prisma.essaySection.create({
    data: { essayId, ...data },
  });
}

export async function updateEssaySection(
  sectionId: string,
  data: {
    title?: string;
    purpose?: string;
    targetWordCount?: number;
    displayOrder?: number;
    notes?: string;
  }
) {
  return prisma.essaySection.update({
    where: { id: sectionId },
    data,
  });
}

export async function addEvidenceItem(
  userId: string,
  essayId: string,
  data: {
    sectionId?: string;
    sourceId?: string;
    sourceChunkId?: string;
    claim: string;
    evidenceText?: string;
    explanation?: string;
    citation?: string;
    tags?: string;
  }
) {
  return prisma.evidenceItem.create({
    data: { essayId, ...data },
  });
}

export async function removeEvidenceItem(evidenceItemId: string) {
  return prisma.evidenceItem.delete({
    where: { id: evidenceItemId },
  });
}

export async function getUserConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      module: { select: { title: true } },
      _count: { select: { messages: true } },
    },
  });
}

export async function getConversationById(userId: string, conversationId: string) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function createConversation(
  userId: string,
  data: {
    title: string;
    moduleId?: string;
    sourceId?: string;
    essayId?: string;
    mode?: string;
  }
) {
  return prisma.conversation.create({
    data: { userId, ...data },
  });
}

export async function addConversationMessage(
  conversationId: string,
  data: {
    role: string;
    content: string;
    citedChunkIds?: string;
  }
) {
  return prisma.conversationMessage.create({
    data: { conversationId, ...data },
  });
}

export async function getUpcomingDeadlines(userId: string) {
  const essays = await prisma.essay.findMany({
    where: { userId, status: { not: "submitted" } },
    include: { module: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return essays;
}
