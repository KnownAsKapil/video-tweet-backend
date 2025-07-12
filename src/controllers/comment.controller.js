import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const pageNumber = parseInt(page) || 1
    const limitNumber = parseInt(limit) || 10

    if(!videoId) throw new apiError(400, "Invalid Video URL")
    
    const comments = await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }

        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            avatar: 1
                        }
                    }
                ]

            }
        },
        {
            $addFields:{
                owner: {
                    $first: "$owner"
                }
            }
        },{
            $skip: (pageNumber - 1)*limitNumber

        },
        {
            $limit: limitNumber
        }
    ])

    res.status(200)
    .json(new apiResponse(200, comments, "Fetched comments successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    const {videoId} = req.params

    const newComment = await Comment.create({
        owner: req.user._id,
        video: new mongoose.Types.ObjectId(videoId),
        content: content

    })

    res.status(200)
    .json(new apiResponse(200,newComment,"Comment successfully added"))

})

const updateComment = asyncHandler(async (req, res) => {
    const {newContent} = req.body
    const {commentId} = req.params

    const existingCommentUser = await Comment.findById(commentId)

    if (!existingCommentUser) {
    throw new apiError(404, "Comment not found")
    }

    const currentOwner = existingCommentUser.owner
    if(currentOwner.toString() !== req.user._id.toString()){
        throw new apiError(400, "Cannot change other user's comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content: newContent
            }
        },
        {new : true}
    )
    return res.status(200)
    .json(new apiResponse(200, updatedComment, "Comment Updated Successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    const existingComment = await Comment.findById(commentId)

    if(!existingComment ) throw new apiError(400, "Comment not found")

    const ownerOfComment = existingComment.owner

    if(ownerOfComment.toString() !== req.user._id.toString()){
        throw new apiError(403, "Cannot delete other's comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if(!deletedComment){
        throw new apiError(500, "Couldn't delete comment")
    }

    res.status(200)
    .json(new apiResponse(200, deletedComment, 'Deleted Comment Successfully'))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }