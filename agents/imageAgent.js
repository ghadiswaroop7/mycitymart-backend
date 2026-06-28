import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import axios from 'axios';
import { Readable } from 'stream';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const processProductImage = async (imageBuffer) => {
  try {
    // Basic image processing with sharp (resize, compress)
    const processedBuffer = await sharp(imageBuffer)
      .resize(800, 800, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'jhatpat_products' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      
      const stream = new Readable();
      stream.push(processedBuffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });

  } catch (error) {
    console.error('Image Agent Error:', error);
    return null;
  }
};
