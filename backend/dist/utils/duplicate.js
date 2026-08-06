"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDuplicateProgram = checkDuplicateProgram;
exports.checkDuplicatePodcast = checkDuplicatePodcast;
exports.checkDuplicateNews = checkDuplicateNews;
exports.checkDuplicateEvent = checkDuplicateEvent;
const prisma_1 = require("../config/prisma");
async function checkDuplicateProgram(name, excludeId) {
    const existing = await prisma_1.prisma.program.findFirst({
        where: {
            name: { equals: name },
            deletedAt: null,
            NOT: excludeId ? { id: excludeId } : undefined,
        },
    });
    return existing !== null;
}
async function checkDuplicatePodcast(title, episodeNumber, season, excludeId) {
    const existing = await prisma_1.prisma.podcast.findFirst({
        where: {
            OR: [
                { title: { equals: title } },
                { AND: [{ episodeNumber }, { season }] },
            ],
            deletedAt: null,
            NOT: excludeId ? { id: excludeId } : undefined,
        },
    });
    return existing !== null;
}
async function checkDuplicateNews(title, excludeId) {
    const existing = await prisma_1.prisma.news.findFirst({
        where: {
            title: { equals: title },
            deletedAt: null,
            NOT: excludeId ? { id: excludeId } : undefined,
        },
    });
    return existing !== null;
}
async function checkDuplicateEvent(title, eventDate, excludeId) {
    const existing = await prisma_1.prisma.event.findFirst({
        where: {
            title: { equals: title },
            deletedAt: null,
            NOT: excludeId ? { id: excludeId } : undefined,
        },
    });
    return existing !== null;
}
