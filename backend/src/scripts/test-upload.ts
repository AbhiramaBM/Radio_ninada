import path from 'path';
import { uploadFileToCloudinary } from '../services/cloudinary.service';

async function main() {
  try {
    const sampleImagePath = path.resolve(__dirname, '../../../frontend/images/radio_ninada_logo.png');
    console.log('🚀 Testing Cloudinary connection & uploading sample logo...');
    console.log(`File path: ${sampleImagePath}`);

    const result = await uploadFileToCloudinary(sampleImagePath, 'radio-ninada/images', 'image');
    console.log('\n======================================================');
    console.log('🎉 SUCCESS! Sample logo uploaded to Cloudinary!');
    console.log(`   - Public ID: ${result.public_id}`);
    console.log(`   - Secure URL: ${result.secure_url}`);
    console.log('======================================================\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Cloudinary Test Upload Error:', error.message || error);
    process.exit(1);
  }
}

main();
