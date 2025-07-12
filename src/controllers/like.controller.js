import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"

import { Tweet } from "../models/tweet.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new apiError(400,"Invalid Video Id")
    }
    if(!isValidObjectId(req.user._id)){
        throw new apiError(400,"Unauthorized request for like")
    }

    const doesVideoExist = await Video.findOne({
        _id: videoId
    })

    if(!doesVideoExist){
        throw new apiError(404, "Video Not Found")
    }
    const isVideoLiked = await Like.findOne({
    video: videoId,
    likedBy: req.user._id
    })

    if(!isVideoLiked){
        const videoLiked = await Like.create({
            
            video: videoId,
            likedBy: req.user._id
        })

        res.status(200)
        .json(new apiResponse(200,videoLiked,"Video is Liked successfully"))
    }
    else{
        const videoUnliked = await Like.findOneAndDelete({
            video: videoId,
            likedBy: req.user._id
        })

        res.status(200)
        .json(new apiResponse(200,videoUnliked,"Videos like deleted successfully"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new apiError(400,"Invalid Comment Id")
    }
    if(!isValidObjectId(req.user._id)){
        throw new apiError(400,"Unauthorized request for like")
    }

    const doesCommentExist = await Comment.findOne({
        _id: commentId
    })

    if(!doesCommentExist){
        throw new apiError(404, "Comment Not Found")
    }

    const isCommentLiked = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id
    })

    if(!isCommentLiked){
        const commentLiked = await Like.create({
            
            comment: commentId,
            likedBy: req.user._id
        })

        res.status(200)
        .json(new apiResponse(200,commentLiked,"Comment is Liked successfully"))
    }
    else{
        const commentUnliked = await Like.findOneAndDelete({
            comment: commentId,
            likedBy: req.user._id
        })

        res.status(200)
        .json(new apiResponse(200,commentUnliked,"Comment's like deleted successfully"))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new apiError(400,"Invalid Tweet Id")
    }

    const doesTweetExist = await Tweet.findOne({
        _id: tweetId
    })

    if(!doesTweetExist){
        throw new apiError(404, "Tweet Not Found")
    }

    if(!isValidObjectId(req.user._id)){
        throw new apiError(400,"Please Login")
    }

    const isTweetLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })


    if(!isTweetLiked){
        const tweetLiked = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })

        res.status(200)
        .json(new apiResponse(200, tweetLiked, "Tweet successfully liked"))
    }
    else{
        const tweetUnliked = await Like.findOneAndDelete({
            tweet: tweetId,
            likedBy: req.user._id
        })

        res.status(200)
        .json(new apiResponse(200, tweetUnliked, "Tweet unliked successfully"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {

    if(!isValidObjectId(req.user._id)){
        throw new apiError(400, "Please login")
    }

    const getVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: 'videos',
                localField: "video",
                foreignField: "_id",
                as: "videoData"
            }
        },
        {
            $unwind: "$videoData"
        },
        {
            $project:{
                video: "$videoData.videoFile",
                title:"$videoData.title",
                thumbnail:"$videoData.thumbnail",
                description:"$videoData.description"
            }
        }
    ])

    res.status(200)
    .json(new apiResponse(200, getVideos, "Successfully fetched all liked videos"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}