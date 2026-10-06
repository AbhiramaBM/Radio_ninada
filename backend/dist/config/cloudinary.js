"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = void 0;
exports.isCloudinaryConfigured = isCloudinaryConfigured;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const index_1 = require("./index");
const isConfigured = Boolean((index_1.config.cloudinary.cloudName && index_1.config.cloudinary.apiKey && index_1.config.cloudinary.apiSecret) ||
    index_1.config.cloudinary.url);
if (isConfigured) {
    if (index_1.config.cloudinary.url) {
        cloudinary_1.v2.config({
            cloudinary_url: index_1.config.cloudinary.url,
            secure: true,
        });
    }
    else {
        cloudinary_1.v2.config({
            cloud_name: index_1.config.cloudinary.cloudName,
            api_key: index_1.config.cloudinary.apiKey,
            api_secret: index_1.config.cloudinary.apiSecret,
            secure: true,
        });
    }
}
function isCloudinaryConfigured() {
    return isConfigured;
}
