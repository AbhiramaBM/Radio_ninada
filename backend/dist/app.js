"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const index_1 = require("./config/index");
const error_1 = require("./middlewares/error");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const live_routes_1 = __importDefault(require("./routes/live.routes"));
const program_routes_1 = __importDefault(require("./routes/program.routes"));
const podcast_routes_1 = __importDefault(require("./routes/podcast.routes"));
const schedule_routes_1 = __importDefault(require("./routes/schedule.routes"));
const news_routes_1 = __importDefault(require("./routes/news.routes"));
const rj_routes_1 = __importDefault(require("./routes/rj.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const gallery_routes_1 = __importDefault(require("./routes/gallery.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const banner_routes_1 = __importDefault(require("./routes/banner.routes"));
const sponsor_routes_1 = __importDefault(require("./routes/sponsor.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use((0, cors_1.default)({ origin: true, credentials: true }));
// Rate Limiter (Max 300 requests per 15 mins)
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);
// Logging & Parsing
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '20mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '20mb' }));
// Static uploads serving
app.use('/uploads', express_1.default.static(index_1.config.uploadDir));
// Static Public Frontend Serving
const frontendPath = path_1.default.join(__dirname, '../../frontend');
app.use(express_1.default.static(frontendPath));
// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'Radio Ninada REST API Server',
        timestamp: new Date().toISOString(),
    });
});
// API Routes Mapping
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/live', live_routes_1.default);
app.use('/api/programs', program_routes_1.default);
app.use('/api/podcasts', podcast_routes_1.default);
app.use('/api/schedule', schedule_routes_1.default);
app.use('/api/news', news_routes_1.default);
app.use('/api/rj', rj_routes_1.default);
app.use('/api/events', event_routes_1.default);
app.use('/api/gallery', gallery_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/banners', banner_routes_1.default);
app.use('/api/sponsors', sponsor_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
// Root route serves the Public Website
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(frontendPath, 'modern_fm_home.html'));
});
// Error Handler
app.use(error_1.errorHandler);
exports.default = app;
