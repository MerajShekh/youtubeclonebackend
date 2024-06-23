import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINAY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    //upload the file on cloudinay
    const uploadResult = await cloudinary.uploader
      .upload(localFilePath, {
        resource_type: "auto",
      })
      .catch((error) => {
        console.log(error);
      });

    console.log("File is uploaded on cloudinay", uploadResult.url);

    console.log(uploadResult);
    return uploadResult;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temporary file as upload operation got failed
    return null;
  }
};

export { uploadOnCloudinary };
