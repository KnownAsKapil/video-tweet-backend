import {asyncHandler} from "./../utils/asyncHandler.js"
import { apiError } from "./../utils/apiError.js"
import {User } from "./../models/user.model.js"
import { cloudinaryUploader } from "../utils/cloudinary.js"
import { apiResponse } from "./../utils/apiResponse.js"
import jwt  from "jsonwebtoken"
import { Subscription } from "../models/subscription.model.js"
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
    console.error("TOKEN ERROR:", error)
    throw new apiError(500, error.message || "Something went wrong while generating tokens")
}

}
const registerUser = asyncHandler(async (req, res) =>{
    const {fullname, email, username, password} =  req.body
    console.log("email:- ", email )

    if (
  [fullname, email, username, password].some((field) => field?.trim() === "")
) {
  throw new apiError(400, "All fields are compulsory");
}

    const existeduser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existeduser){
        throw new apiError(409, "User Already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path


    let coverImageLocalPath

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath) throw new apiError(400, "Avatar file is required")

    const avatar = await cloudinaryUploader(avatarLocalPath)
    const coverImage = await cloudinaryUploader(coverImageLocalPath)

    if(!avatar){
        throw new apiError(400, "Avatar is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, password, username: username.toLowerCase()
    })
    
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new apiError(500, 'Something went wrong while registering the user')
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User Registered Successfully")
    )

})

const loginUser = asyncHandler(async (req,res) =>{

    const {email,username, password} = req.body

    if(!username && !email ){
        throw new apiError(400, "Username or email is required")
    }
    const user = await User.findOne({
        $or: [{email},{username}]
    })

    if(!user){
        throw new apiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new apiError(401, "Invalid User credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken", refreshToken, options)

    .json(
        new apiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        },"User logged in successfully"
    )
    )

})

const logoutUser = asyncHandler(async (req,res) =>{
    await User.findByIdAndUpdate(
        req.user._id,{
            $unset:{
                refreshToken: 1

            }
        },
        {
            new: true
        }

    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken")
    .json(new apiResponse(200, {}, "User logged out"))
})

const refreshAccessToken = asyncHandler( async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new apiError(401, "Unauthorized Access")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) throw new apiError(400, "Invalid Refresh Token")
    
        if(incomingRefreshToken !== user?.refreshToken) throw new apiError(404, "Refresh token is expired or used")
        
            
        const options={
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new apiResponse(200,{accessToken, refreshToken},"Access Token Refreshed"))
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid Refresh Token")
    }



})

const changeCurrentUserPassword = asyncHandler(async (req,res) => {
    const {oldPassword, newPassword} = req.body 

    const user = await User.findById(req.user?._id)

    const correctPassword = await user.isPasswordCorrect(oldPassword)

    if(!correctPassword){
        throw new apiError(400, "Invalid password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(new apiResponse(200,{},"Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res.status(200)
    .json(new apiResponse(200, req.user,"Current user fetched successfully"))
})

const updateUserDetails = asyncHandler(async (req, res) =>{
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new apiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname: fullname,
                email: email
            }
        },
        {new: true}
    ).select("-password")
    return res.status(200)
    .json(new apiResponse(200,user,"User details updated"))
})

const updateUserAvatar = asyncHandler(async (req,res) =>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is missing")
    }

    const avatar = await cloudinaryUploader(avatarLocalPath)

    if(!avatar.url) throw new apiError(500, "Error while uploading the avatar")

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set:
            {
                avatar: avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200)
    .json(
        new apiResponse(200, user, "Avatar updated successfully")
    )
    
})

const updateUserCoverImage = asyncHandler(async (req,res) =>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new apiError(400, "Cover file is missing")
    }

    const coverImage = await cloudinaryUploader(coverImageLocalPath)

    if(!coverImage.url) throw new apiError(500, "Error while uploading the coverImage")

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set:
            {
                coverImage: coverImage.url
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200)
    .json(
        new apiResponse(200, user, "Cover Image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req,res) => {
    const {username } = req.params

    if(!username?.trim()) throw new apiError(400, "Username doesn't exist")
    
    const channel = await User.aggregate([{
        $match:{
            username: username?.toLowerCase()
        }
    },
    {
        $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField:"channel",
            as: "subscribers",
            
        }
    },
    {
        $lookup:{
            from: "subscriptions",
            localField:"_id",
            foreignField: "subscriber",
            as:"subscribedTo"
        }
    },
    {
        $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelsSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
        }
    },
    {
        $project: {
            fullname: 1,
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed:1,
            avatar: 1,
            email: 1,
            coverImage: 1,

        }
    }
    ])

    if(!channel?.length){
        throw new apiError(400,"channel doesn't exist")
    }

    return res
    .status(200)
    .json(new apiResponse(200,channel[0],"User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req,res) =>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId( req.user._id )

            }
        },
        {
            $lookup:{
                from:"videos",
                localField: "watchHistory",
                foreignField: "_id",
                as : "watchHistory",

                pipeline:[
                {
                    $lookup:{
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                                $project:{
                                    fullname: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            },
                        ]
                    }
                },
                {
                    $addFields:{
                        owner:{
                            $first :"$owner"
                        }
                    }
                }
            ]
            }

            
        }
    ])
    return res.status(200)
    .json(new apiResponse(200,user[0].watchHistory,"Fetched Watch History successfully"))
})



export { 
    getWatchHistory,
    updateUserDetails, 
    changeCurrentUserPassword, 
    getCurrentUser, 
    refreshAccessToken, 
    logoutUser, 
    loginUser, 
    registerUser,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}