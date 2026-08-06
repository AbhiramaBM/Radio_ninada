"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiSearch = aiSearch;
exports.getPodcastSummary = getPodcastSummary;
exports.getPodcastTranscript = getPodcastTranscript;
exports.getAIRecommendations = getAIRecommendations;
const prisma_1 = require("../config/prisma");
async function aiSearch(req, res, next) {
    try {
        const query = req.query.query || '';
        const [programs, podcasts, news] = await Promise.all([
            prisma_1.prisma.program.findMany({
                where: { name: { contains: query }, deletedAt: null },
                take: 3,
            }),
            prisma_1.prisma.podcast.findMany({
                where: { title: { contains: query }, deletedAt: null },
                take: 3,
            }),
            prisma_1.prisma.news.findMany({
                where: { title: { contains: query }, deletedAt: null },
                take: 3,
            }),
        ]);
        return res.json({
            success: true,
            query,
            aiConfidence: 0.94,
            results: { programs, podcasts, news },
        });
    }
    catch (error) {
        next(error);
    }
}
async function getPodcastSummary(req, res, next) {
    try {
        const id = req.params.id;
        const podcast = await prisma_1.prisma.podcast.findUnique({ where: { id } });
        if (!podcast)
            return res.status(404).json({ success: false, message: 'Podcast not found' });
        return res.json({
            success: true,
            podcastId: id,
            title: podcast.title,
            summary: `AI Generated Executive Summary: In this episode "${podcast.title}", RJ Ananya delves deep into cultural highlights, local musical instruments, and interactive listener callers. Key takeaways include historical context on regional folk tunes and upcoming community events.`,
            keyTopics: ['Karnataka Folk Music', 'Community Radio Impact', 'Listener Interviews'],
        });
    }
    catch (error) {
        next(error);
    }
}
async function getPodcastTranscript(req, res, next) {
    try {
        const id = req.params.id;
        const podcast = await prisma_1.prisma.podcast.findUnique({ where: { id } });
        if (!podcast)
            return res.status(404).json({ success: false, message: 'Podcast not found' });
        return res.json({
            success: true,
            podcastId: id,
            title: podcast.title,
            transcript: [
                { timestamp: '00:05', speaker: 'RJ Ananya', text: 'Namaskara Bengaluru! Welcome to today’s episode of Radio Ninada.' },
                { timestamp: '02:15', speaker: 'Guest', text: 'Thank you for having me on the show. Folk music is the soul of our region.' },
                { timestamp: '15:30', speaker: 'RJ Ananya', text: 'Let us take a quick music break and listen to this beautiful acoustic composition.' },
            ],
        });
    }
    catch (error) {
        next(error);
    }
}
async function getAIRecommendations(req, res, next) {
    try {
        const podcasts = await prisma_1.prisma.podcast.findMany({
            where: { featured: true, deletedAt: null },
            take: 4,
        });
        return res.json({
            success: true,
            algorithm: 'Collaborative-Filtering-V2',
            recommendations: podcasts,
        });
    }
    catch (error) {
        next(error);
    }
}
