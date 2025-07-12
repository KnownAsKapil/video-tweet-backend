import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if(!isValidObjectId(req.user._id)){
        throw new apiError(400, "Login to Subscribe!!")
    }

    if (!isValidObjectId(channelId)) {
        throw new apiError(400, "Invalid Channel Id");
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);
    const channelObjectId = new mongoose.Types.ObjectId(channelId);

    const getChannel = await Subscription.findOne({
        subscriber: userId,
        channel: channelObjectId
    })



    if(!getChannel){
        const subscribed = await
        Subscription.create({
            subscriber: userId,
            channel: channelObjectId
        })

        res.status(200)
        .json(new apiResponse(200, subscribed, "Subscription added"))
    }
    else{
        const unsubscribed = await Subscription.findOneAndDelete({
            subscriber: userId,
            channel: channelObjectId
        })

        res.status(200)
        .json(new apiResponse(200, unsubscribed, "Subscription removed"))
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(req.user._id)){
        throw new apiError(400, "Login to Subscribe!!")
    }

    console.log("channelId:", channelId);
    console.log("isValidObjectId(channelId):", isValidObjectId(channelId));

    if (!isValidObjectId(channelId)) {
        throw new apiError(400, "Invalid Channel Id");
    }

    const subscriberList = await Subscription.find({channel: channelId})
    .populate("subscriber", "-password -refreshToken -email")
    .select("subscriber")

    res.status(200)
    .json(new apiResponse(200, subscriberList, "Subscribers fetched"))


})
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(req.user._id)){
        throw new apiError(400, "Login to Subscribe!!")
    }

    if (!isValidObjectId(subscriberId)) {
        throw new apiError(400, "Invalid subscriber Id");
    }

    const channelList = await Subscription.find({subscriber: subscriberId})
    .populate("channel", "-password -refreshToken -email")
    .select("channel")

    res.status(200)
    .json(new apiResponse(200, channelList, "Channel fetched"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}