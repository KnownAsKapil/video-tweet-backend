import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    if(!isValidObjectId(req.user._id)){
        throw new apiError(400,"Please login to create tweets")
    }

    if(!content){
        throw new apiError(400,'Content is missing')
    }

    const tweet = await Tweet.create({
        content,
        owner: new mongoose.Types.ObjectId(req.user._id)
    })

    res.status(200)
    .json(new apiResponse(200, tweet, "Tweet Created"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    if(!isValidObjectId(req.user._id)){
        throw new apiError(400,"Please login to create tweets")
    }

    const { userId } = req.params
    if(!isValidObjectId(userId)){
        throw new apiError(400, "Invalid userId")
    }

    const getTweets = await Tweet.find({
        owner: userId
    })

    if(getTweets.length == 0){
        throw new apiError(404, "Couldn't fetch the tweets")
    }

    res.status(200)
    .json(new apiResponse(200, getTweets, "tweets fetched"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { tweetId } = req.params

    if(!isValidObjectId(req.user._id)){
        throw new apiError(400, 'please login to use this feature')
    }

    if(!isValidObjectId(tweetId)){
        throw new apiError(400, "Invalid tweetId")
    }

    const checkOwnership = await Tweet.findById(tweetId)

    if(!checkOwnership){
        throw new apiError(404, "Tweet not found")
    }

    if(checkOwnership.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, "You're not the owner of the tweet")
    }

    if(!content){
        throw new apiError(400, "Empty tweet is not allowed")
    }

    const updateTweet = await Tweet.findByIdAndUpdate(tweetId, 
        {
            content
        },
        {
            new: true
        }
    )

    res.status(200)
    .json( new apiResponse (200, updateTweet, "Tweet Updated"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if(!isValidObjectId(req.user._id)){
        throw new apiError(400, 'please login to use this feature')
    }

    if(!isValidObjectId(tweetId)){
        throw new apiError(400, "Invalid tweetId")
    }

    const checkOwnership = await Tweet.findById(tweetId)

    if(!checkOwnership){
        throw new apiError(404, "Tweet not found")
    }

    if(checkOwnership.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, "You're not the owner of the tweet")
    }

    const deleteTweet = await Tweet.findByIdAndDelete(tweetId)

    if (!deleteTweet) throw new apiError(404, "Tweet not found")

    res.status(200)
    .json(new apiResponse(200, deleteTweet, "Tweet Successfully deleted"))
    
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}