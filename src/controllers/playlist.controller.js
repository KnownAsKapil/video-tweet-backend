import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!isValidObjectId(req.user._id)){
        throw new apiError(400,"Please login to use this feature")
    }

    if(!name || !description){
        throw new apiError(400, "Please provide both name and description")
    }

    const newPlaylist = await Playlist.create({
        name: name,
        description: description,
        owner: req.user._id
    })

    res.status(200)
    .json(new apiResponse(200,newPlaylist, "Playlist created "))


})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(req.user._id)){
        throw new apiError(400,"Please login to use this feature")
    }

    if(!isValidObjectId(userId)){
        throw new apiError(400,"Invalid User Id")
    }


    const findPlaylists = await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as: "VideoDetails"
            }
        }
    ])

    res.status(200)
    .json(new apiResponse(200, findPlaylists, "Found User's playlist"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(req.user._id)){
        throw new apiError(400,"Please login to use this feature")
    }

    if(!isValidObjectId(playlistId)){
        throw new apiError(400,"Invalid Playlist Id")
    }

    const findPlaylist = await Playlist.findById(playlistId)

    if(!findPlaylist){
        throw new apiError(404,"Playlist not found")
    }

    if (!isValidObjectId(playlistId)) {
        throw new apiError(400, "Invalid Playlist Id");
    }

    res.status(200)
    .json(new apiResponse(200, findPlaylist,    "Playlist found"))

    
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(req.user._id)){
        throw new apiError(400,"Please login to use this feature")
    }

    if(!isValidObjectId(playlistId)){
        throw new apiError(400,"Invalid Playlist Id")
    }

    if(!isValidObjectId(videoId)){
        throw new apiError(400,"Invalid Video Id")
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new apiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, "You cannot edit other's playlist")
    }

    const findVideo = await Video.findById(videoId)

    if(!findVideo){
        throw new apiError(404,"Video Doesn't exist")
    }

    const findPlaylistAndUpdate = await Playlist.findByIdAndUpdate(playlistId,
        {
            $addToSet:{
                video: videoId
            }
        },
        {
            new: true
        }
    )

    res.status(200)
    .json(new apiResponse(200, findPlaylistAndUpdate, "Video added to the playlist"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(req.user._id)){
        throw new apiError(400, "User not logged in")
    }

    if(!isValidObjectId(playlistId)){
        throw new apiError(400, "Playlist id invalid")
    }


    if(!isValidObjectId(videoId)){
        throw new apiError(400, "Video id is invalid")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new apiError(404, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, "You cannot edit others' playlist")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new apiError(404, "Video not found")
    }

    const findPlaylistAndDelete = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                video: videoId
            }
        },
        {
            new: true
        }
    )

    res.status(200)
    .json( new apiResponse (200, findPlaylistAndDelete, "Video removed from playlist"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if(!isValidObjectId(req.user._id)){
        throw new apiError(400, "User not logged in")
    }

    if(!isValidObjectId(playlistId)){
        throw new apiError(400, "Playlist id invalid")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new apiError(404, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, "You cannot edit others' playlist")
    }

    const findPlaylistAndDelete = await Playlist.findByIdAndDelete(playlistId)

    res.status(200)
    .json(new apiResponse(200, findPlaylistAndDelete, "Playlist successfully deleted"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!isValidObjectId(req.user._id)){
        throw new apiError(400, "User not logged in")
    }

    if(!name || !description){
        throw new apiError(400, "Name and Description cannot be empty")
    }

    if(!isValidObjectId(playlistId)){
        throw new apiError(400, "Playlist id invalid")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new apiError(404, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, "You cannot edit others' playlist")
    }

    const findPlaylistAndUpdate = await Playlist.findByIdAndUpdate(playlistId,
        {
            name, description
        },
        {
            new: true
        }
    )

    res.status(200)
    .json( new apiResponse(200, findPlaylistAndUpdate, "Playlist name and description updated"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}