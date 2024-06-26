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
    fs.unlinkSync(localFilePath);
    // console.log("CLOUDINARY:", uploadResult);
    return uploadResult;
  } catch (error) {
    console.log("CLOUDINARY_ERROR:", error);
    fs.unlinkSync(localFilePath); //remove the locally saved temporary file as upload operation got failed
    return null;
  }
};

export { uploadOnCloudinary };
