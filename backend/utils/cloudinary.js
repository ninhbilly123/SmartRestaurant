import { v2 as cloudinary } from 'cloudinary';

// Config với additional options
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Luôn dùng HTTPS
});

/**
 * Upload buffer lên Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Cloudinary folder path
 * @param {string} filename - File name (without extension)
 * @param {object} options - Additional options
 * @returns {Promise<string>} Secure URL của ảnh
 */
export async function uploadBufferToCloudinary(buffer, folder, filename, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      public_id: filename,
      resource_type: 'image',
      transformation: []
    };

    // Add transformations if specified
    if (options.transformations) {
      uploadOptions.transformation = options.transformations;
    } else if (options.width || options.height) {
      uploadOptions.transformation = [
        {
          width: options.width,
          height: options.height,
          crop: options.crop || 'fill',
          gravity: options.gravity || 'auto'
        },
        { quality: 'auto:good' }
      ];
    } else {
      // Default optimization
      uploadOptions.transformation = [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload failed:', {
            folder,
            filename,
            error: error.message
          });
          reject(new Error(`Upload ảnh thất bại: ${error.message}`));
        } else {
          console.log('Cloudinary upload successful:', {
            folder,
            filename,
            size: result.bytes,
            format: result.format,
            url: result.secure_url.substring(0, 50) + '...'
          });
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Xóa ảnh từ Cloudinary
 * @param {string} url - Cloudinary URL
 * @returns {Promise<boolean>}
 */
export async function deleteFromCloudinary(url) {
  try {
    // Extract public_id từ URL Cloudinary
    // Pattern: /upload/[version/]public_id.extension
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    
    if (uploadIndex === -1) {
      throw new Error('URL không phải Cloudinary URL hợp lệ');
    }
    
    // Lấy phần sau 'upload'
    const afterUpload = pathParts.slice(uploadIndex + 1).join('/');
    // Bỏ version prefix nếu có (v1234567/)
    const publicIdWithExt = afterUpload.replace(/^v\d+\//, '');
    // Bỏ extension
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log('Cloudinary delete successful:', { publicId });
      return true;
    } else {
      throw new Error(`Cloudinary trả về: ${result.result}`);
    }
  } catch (error) {
    console.error('Cloudinary delete failed:', {
      url,
      error: error.message
    });
    throw error;
  }
}

/**
 * Tạo URL với transformations
 * @param {string} publicId 
 * @param {Array} transformations 
 * @returns {string}
 */
export function generateTransformedUrl(publicId, transformations = []) {
  return cloudinary.url(publicId, {
    transformation: transformations
  });
}

// Export mặc định
export default {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  generateTransformedUrl,
  uploader: cloudinary.uploader,
  config: cloudinary.config
};
