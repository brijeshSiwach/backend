import {v2 as cloudinary} from 'cloudinary';
import { unLink } from './unLink.js';
          
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {

      if(!localFilePath) return null;

      const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type: "auto"
      })

      unLink(localFilePath);

      console.log("file is uploaded on cloudinary", response);
      return response;

    } catch (error) {
      unLink(localFilePath); // remove the locally stored temporary file
      return null;
    } 
}

export  { uploadOnCloudinary };

