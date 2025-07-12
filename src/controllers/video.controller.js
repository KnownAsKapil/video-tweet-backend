import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {cloudinaryUploader} from "../utils/cloudinary.js"

function objectChecker(id, name){
    if(!isValidObjectId(id)){
        throw new apiError(400, `Invalid ${name}`)
    }
}

function validChecker(id, name){
    if(!id){
        throw new apiError(400,`Invalid ${name}`)
    }
}

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    objectChecker(req.user._id, "userId")

    const matchOptions = {}

    if(query){
        matchOptions.title = {$regex : query, $options: "i"}
    }

    if(userId){
        objectChecker(userId, "userId")
        matchOptions.owner = userId
    }

    const sortField = sortBy || "createdAt"
    const sortOrder = sortType === "asc" ? 1 : -1

    const sortOption = { [sortField] : sortOrder }

    const pipeline = [ 
        {
            $match: matchOptions
        },
        {
            $sort: sortOption
            
        }
    ]

    const videoSearch = await Video.aggregatePaginate(Video.aggregate(pipeline), {
        page: parseInt(page), limit:parseInt(limit)
    })


    res.status(200)
    .json(new apiResponse(200, videoSearch, "Got all videos"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    objectChecker(req.user._id, "user")

    const videoArr = req.files.videoFile || []
    const thumbnailArr = req.files.thumbnail || []

    if (videoArr.length === 0 || thumbnailArr.length === 0) {
        throw new apiError(400, "Both videoFile and thumbnail are required");
    }

    
    validChecker(title, "title")
    validChecker(description, "description")

    const videoLocalPath = videoArr[0].path
    const thumbnailLocalPath = thumbnailArr[0].path

    const videoUpload = await cloudinaryUploader(videoLocalPath)
    const thumbnailUpload = await cloudinaryUploader(thumbnailLocalPath)

    validChecker(videoUpload.url, "video url");
    validChecker(thumbnailUpload.url, "thumbnail url");


    const video = await Video.create({
        owner: req.user._id,
        title,description,
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        duration: videoUpload.duration,
        isPublished: false
    })

    res.status(201)
    .json(new apiResponse(201, video, "Video published"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    objectChecker(req.user._id, "user")

    objectChecker(videoId,"videoId")

    const findVideo = await Video.findById(videoId).populate("owner", "username avatar")

    if (!findVideo) {
        throw new apiError(404, "Video not found");
    }


    res.status(200)
    .json(new apiResponse(200, findVideo, "Video Found"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const findVideo = await Video.findById(videoId)

    objectChecker(req.user._id, "user")

    objectChecker(videoId,"videoId")
    
    if(!findVideo){
        throw new apiError(400, "video not found")
    }

    if(findVideo.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, "You cannot edit others' videos")
    }
    

    const {title, description} = req.body

    const thumbnailPath = req.file?.path

    const updateObj = {}

    if(title) updateObj.title = title
    if(description) updateObj.description = description

    if(thumbnailPath){
         const thumbnailUpload = await cloudinaryUploader(thumbnailPath)
         updateObj.thumbnail = thumbnailUpload.url
    }
    
    

    const updateVideo = await Video.findByIdAndUpdate(videoId,updateObj,
    {
        new: true
    })

    res.status(200)
    .json(new apiResponse(200, updateVideo, "Video updated"))
    

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    const findVideo = await Video.findById(videoId)

    objectChecker(req.user._id, "user")
    objectChecker(videoId, "videoId")
    
    if (!findVideo) {
        throw new apiError(404, "video not found")
    }

    if (findVideo.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You cannot delete others' videos")
    }

    await cloudinary.uploader.destroy(findVideo.public_id, {
        resource_type: "video"
    })

    await cloudinary.uploader.destroy(findVideo.thumbnail_public_id, {
        resource_type: "image"
    })

    const deleteVideo = await Video.findByIdAndDelete(videoId)

    res.status(200)
    .json(new apiResponse(200, deleteVideo, "Video Successfully deleted"))
})


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params


    const findVideo = await Video.findById(videoId)

    objectChecker(req.user._id, "user")

    objectChecker(videoId,"videoId")
    
    if(!findVideo){
        throw new apiError(404, "video not found")
    }

    if(findVideo.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, "You cannot edit others' videos")
    }

    const updateObj = {isPublished: !findVideo.isPublished}

    

    const updateVideo = await Video.findByIdAndUpdate(videoId, updateObj,
    {
        new: true
    })

    res.status(200)
    .json(new apiResponse(200, updateVideo, "Video updated"))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}