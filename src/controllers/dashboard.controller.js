import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    if(!req.user._id){
        throw new apiError(400,"Please Login")
    }

    const totalVideos = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(req.user._id)
            },
            
        },
        {
            $count: "TotalVideos"
        }
        
    ])

    const videoCount = totalVideos[0]?.TotalVideos || 0

    const totalLikes = await Like.aggregate([
    {
        $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "videoData"
        }
    },
    {
        $unwind: "$videoData"
    },
    {
        $match: {
            "videoData.owner": new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $count: "TotalLikesReceived"
    }
])

const likeCountReceived = totalLikes[0]?.TotalLikesReceived || 0

    const totalViews = await Video.aggregate([
    {
        $match: {
            owner: new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $group: {
            _id: null,
            totalViews: { $sum: "$views" }
        }
    }
    ]);

    const viewCount = totalViews[0]?.totalViews || 0;




    const totalSubscribers = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(req.user._id)
            },
            
        },
        {
            $count: "TotalSubs"
        }
    ])

    const subCount = totalSubscribers[0]?.TotalSubs || 0

    res.status(200).json(new apiResponse(200, {
    videoCount,
    viewCount,
    likeCountReceived,
    subCount
}, "Channel stats fetched successfully"))
   

})

const getChannelVideos = asyncHandler(async (req, res) => {
    if(!req.user._id){
        throw new apiError(400,"Please Login")
    }

    const allVideos = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
    ])
    res.status(200)
    .json(new apiResponse(200,allVideos, "All videos successfully fetched"))
})

export {
    getChannelStats, 
    getChannelVideos
    }