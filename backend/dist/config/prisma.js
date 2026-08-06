"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const index_1 = require("./index");
exports.prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: index_1.config.databaseUrl,
        },
    },
});
