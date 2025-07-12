import { v2 as cloudinary } from "cloudinary"
import fs from "fs"


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const cloudinaryUploader = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"  
        })

        console.log("File is uploaded in cloudinary server", response.url)
        fs.unlinkSync(localFilePath)
        return response
    } 

    catch (error) {
        if (fs.existsSync(localFilePath)) {         
            fs.unlinkSync(localFilePath) 
        }
        console.error("Cloudinary upload error in server:", error);  
        return null
    }
}


cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
        public_id: 'shoes',
        type: 'fetch',
    }
)
.catch((error) => {
    console.log(error);
});

export { cloudinaryUploader }
