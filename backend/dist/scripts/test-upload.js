"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const cloudinary_service_1 = require("../services/cloudinary.service");
async function main() {
    try {
        const sampleImagePath = path_1.default.resolve(__dirname, '../../../frontend/images/radio_ninada_logo.png');
        console.log('🚀 Testing Cloudinary connection & uploading sample logo...');
        console.log(`File path: ${sampleImagePath}`);
        const result = await (0, cloudinary_service_1.uploadFileToCloudinary)(sampleImagePath, 'radio-ninada/images', 'image');
        console.log('\n======================================================');
        console.log('🎉 SUCCESS! Sample logo uploaded to Cloudinary!');
        console.log(`   - Public ID: ${result.public_id}`);
        console.log(`   - Secure URL: ${result.secure_url}`);
        console.log('======================================================\n');
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Cloudinary Test Upload Error:', error.message || error);
        process.exit(1);
    }
}
main();
