const { v2: cloudinary } = require('cloudinary'); // Fixed: Use .v2 import

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Use HTTPS URLs
});

// Test connection and verify configuration
const testCloudinaryConnection = async () => {
    try {
        console.log('🔍 Testing Cloudinary configuration...');
        console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
        console.log('API key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing');
        console.log('API secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing');

        // Test the configuration
        const result = await cloudinary.api.ping();
        console.log('✅ Cloudinary connection successful:', result);

        // Test uploader availability
        if (cloudinary.uploader) {
            console.log('✅ Cloudinary uploader available');
        } else {
            console.error('❌ Cloudinary uploader not available');
        }

        return true;
    } catch (error) {
        console.error('❌ Cloudinary connection failed:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            status: error.status
        });
        return false;
    }
};

module.exports = {
    cloudinary,
    testCloudinaryConnection
};