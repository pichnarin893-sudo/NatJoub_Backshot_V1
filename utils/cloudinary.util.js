const { v2: cloudinary } = require('cloudinary');
const multer = require('multer');
const { photos, branches, rooms } = require('../models');

// Configure multer for memory storage (Cloudinary works with buffers)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 10
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
    }
});

class CloudinaryPhotoUtil {

    /**
     * Upload multiple photos for a branch to Cloudinary
     */
    async uploadBranchPhotos(branchId, photoFiles) {
        console.log('🔍 Cloudinary upload - Branch photos:', photoFiles.length);

        try {
            // Validate branch exists
            const branch = await branches.findByPk(branchId);
            if (!branch) {
                throw new Error(`Branch with ID ${branchId} not found`);
            }

            //check if the current branch already has images uploaded
            const isExistingImages = await photos.findAll({
                where: {
                    entity_id: branchId
                }
            })

            if(isExistingImages.length >= 3){
                throw new Error("Branch already has maximum number of images (3). Delete existing images before uploading new ones.");
            }

            // Get current max display_order
            const maxOrder = await this.getMaxDisplayOrder('branches', branchId);

            // Upload all photos to Cloudinary in parallel
            const uploadPromises = photoFiles.map((file, index) =>
                this.uploadSinglePhoto('branches', branchId, file, maxOrder + index + 1)
            );

            const uploadedPhotos = await Promise.all(uploadPromises);

            return {
                success: true,
                message: `Successfully uploaded ${uploadedPhotos.length} photos for branch`,
                data: uploadedPhotos
            };

        } catch (error) {
            console.error('❌ Cloudinary branch photo upload failed:', error);
            throw new Error(`Branch photo upload failed: ${error.message}`);
        }
    }

    /**
     * Upload multiple photos for a room to Cloudinary
     */
    async uploadRoomPhotos(roomId, photoFiles) {
        console.log('🔍 Cloudinary upload - Room photos:', photoFiles.length);

        try {
            // Validate room exists
            const room = await rooms.findByPk(roomId);
            if (!room) {
                throw new Error(`Room with ID ${roomId} not found`);
            }

            //check if the current branch already has images uploaded
            const isExistingImages = await photos.findAll({
                where: {
                    entity_id: roomId
                }
            })

            if(isExistingImages.length >= 3){
                throw new Error("Branch already has maximum number of images (3). Delete existing images before uploading new ones.");
            }

            // Get current max display_order
            const maxOrder = await this.getMaxDisplayOrder('rooms', roomId);

            // Upload all photos to Cloudinary in parallel
            const uploadPromises = photoFiles.map((file, index) =>
                this.uploadSinglePhoto('rooms', roomId, file, maxOrder + index + 1)
            );

            const uploadedPhotos = await Promise.all(uploadPromises);

            return {
                success: true,
                message: `Successfully uploaded ${uploadedPhotos.length} photos for room`,
                data: uploadedPhotos
            };

        } catch (error) {
            console.error('❌ Cloudinary room photo upload failed:', error);
            throw new Error(`Room photo upload failed: ${error.message}`);
        }
    }

    /**
     * Upload a single photo to Cloudinary and save metadata to database
     */
    async uploadSinglePhoto(entityType, entityId, file, displayOrder) {
        console.log('🔍 Cloudinary single upload:', {
            entityType,
            entityId,
            filename: file.originalname,
            size: file.size
        });

        try {
            // Verify cloudinary uploader is available
            if (!cloudinary.uploader) {
                throw new Error('Cloudinary uploader not available - check configuration');
            }

            // Generate unique public_id
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.(jpg|jpeg|png|webp)$/i, '');
            const publicId = `natjoub/${entityType}/${entityId}/${timestamp}_${randomSuffix}_${cleanName}`;

            console.log('☁️ Uploading to Cloudinary with public_id:', publicId);

            // Upload to Cloudinary using upload_stream
            const cloudinaryResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        public_id: publicId,
                        folder: `natjoub/${entityType}/${entityId}`,
                        resource_type: 'image',
                        quality: 'auto',
                        fetch_format: 'auto',
                        transformation: [
                            { width: 1200, crop: 'limit' },
                            { quality: 85 }
                        ]
                    },
                    (error, result) => {
                        if (error) {
                            console.error('❌ Cloudinary upload error:', error);
                            reject(error);
                        } else {
                            console.log('✅ Cloudinary upload success:', result.public_id);
                            resolve(result);
                        }
                    }
                );

                // Check if uploadStream is valid
                if (!uploadStream || typeof uploadStream.end !== 'function') {
                    reject(new Error('Failed to create upload stream'));
                    return;
                }

                uploadStream.end(file.buffer);
            });

            // Save to database
            console.log('💾 Saving to database...');
            const photoRecord = await photos.create({
                entity_type: entityType,
                entity_id: entityId,
                public_url: cloudinaryResult.secure_url,
                public_path: cloudinaryResult.public_id,
                filename: file.originalname,
                mime_type: file.mimetype,
                file_size: file.size,
                display_order: displayOrder
            });

            console.log('✅ Photo saved to database with ID:', photoRecord.id);

            return {
                id: photoRecord.id,
                url: cloudinaryResult.secure_url,
                cloudinary_public_id: cloudinaryResult.public_id,
                filename: file.originalname,
                display_order: displayOrder,
                file_size: file.size,
                mime_type: file.mimetype,
                width: cloudinaryResult.width,
                height: cloudinaryResult.height
            };

        } catch (error) {
            console.error('❌ Single Cloudinary upload failed:', error);
            throw new Error(`Single photo upload failed: ${error.message}`);
        }
    }

    /**
     * Get maximum display_order for an entity
     */
    async getMaxDisplayOrder(entityType, entityId) {
        const result = await photos.findOne({
            where: {
                entity_type: entityType,
                entity_id: entityId
            },
            order: [['display_order', 'DESC']],
            attributes: ['display_order']
        });

        return result ? result.display_order : 0;
    }

    /**
     * Delete a photo from both Cloudinary and database
     */
    async deletePhoto(photoId) {
        try {
            // Find photo record
            const photoRecord = await photos.findByPk(photoId);
            if (!photoRecord) {
                throw new Error(`Photo with ID ${photoId} not found`);
            }

            // Delete from Cloudinary using public_id
            try {
                const cloudinaryResult = await cloudinary.uploader.destroy(photoRecord.public_path);
                console.log('✅ Deleted from Cloudinary:', cloudinaryResult);
            } catch (cloudinaryError) {
                console.warn('⚠️ Cloudinary deletion failed (file might not exist):', cloudinaryError.message);
            }

            // Delete from database
            await photoRecord.destroy();

            return {
                success: true,
                message: 'Photo deleted successfully',
                deletedPhotoId: photoId
            };

        } catch (error) {
            console.error('❌ Photo deletion failed:', error);
            throw new Error(`Photo deletion failed: ${error.message}`);
        }
    }

    /**
     * Get all photos for a branch
     */
    async getBranchPhotos(branchId) {
        try {
            return await photos.findAll({
                where: {
                    entity_type: 'branches',
                    entity_id: branchId
                },
                attributes:['id', 'public_url', 'display_order'],
                order: [['display_order', 'ASC'], ['createdAt', 'ASC']]
            });


        } catch (error) {
            throw new Error(`Failed to get branch photos: ${error.message}`);
        }
    }

    /**
     * Get all photos for a room
     */
    async getRoomPhotos(roomId) {
        try {
            const roomPhotos = await photos.findAll({
                where: {
                    entity_type: 'rooms',
                    entity_id: roomId
                },
                order: [['display_order', 'ASC'], ['createdAt', 'ASC']]
            });

            return {
                success: true,
                data: roomPhotos
            };

        } catch (error) {
            throw new Error(`Failed to get room photos: ${error.message}`);
        }
    }


    /**
     * Update photo display order
     */
    async updatePhotoOrder(photoId, newDisplayOrder) {
        try {
            const photoRecord = await photos.findByPk(photoId);
            if (!photoRecord) {
                throw new Error(`Photo with ID ${photoId} not found`);
            }

            await photoRecord.update({ display_order: newDisplayOrder });

            return {
                success: true,
                message: 'Photo order updated successfully',
                data: photoRecord
            };

        } catch (error) {
            throw new Error(`Photo order update failed: ${error.message}`);
        }
    }
}

// Export singleton instance
const cloudinaryPhotoUtil = new CloudinaryPhotoUtil();

module.exports = {
    upload,
    cloudinaryPhotoUtil,
    uploadBranchPhotos: cloudinaryPhotoUtil.uploadBranchPhotos.bind(cloudinaryPhotoUtil),
    uploadRoomPhotos: cloudinaryPhotoUtil.uploadRoomPhotos.bind(cloudinaryPhotoUtil),
    deletePhoto: cloudinaryPhotoUtil.deletePhoto.bind(cloudinaryPhotoUtil),
    getBranchPhotos: cloudinaryPhotoUtil.getBranchPhotos.bind(cloudinaryPhotoUtil),
    getRoomPhotos: cloudinaryPhotoUtil.getRoomPhotos.bind(cloudinaryPhotoUtil),
    updatePhotoOrder: cloudinaryPhotoUtil.updatePhotoOrder.bind(cloudinaryPhotoUtil)
};