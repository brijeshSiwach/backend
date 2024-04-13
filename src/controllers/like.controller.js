import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Video } from "../models/video.model";
import { Like } from "../models/like.model";
import { Comment } from "../models/comment.model";
import { Tweet } from "../models/tweet.model";


const toggleVideoLike = asyncHandler( async( req, res) => {
    const { videoId } = req.params
    const { user } = req.body

    if (!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video Does Not Exist")
    }

    const isLike = await Like.findOne({
        video: videoId,
        likedBy: user._id
    })

    if(isLike) {
        await Like.deleteOne({_id: isLike._id})

        const like = await Like.findById(isLike._id)

        if (like){
            throw new ApiError(500, "Error while toggling the like of video")
        }
    }
    else {
        const like = await Like.create({
            video: videoId,
            likedBy: user._id
        })

        if (!like){
            throw new ApiError(500, "Error while toggling the like of video")
        }

    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "", "Like is Successfully toggled")
    )
})

const toggleCommentLike = asyncHandler( async( req, res) => {
    const { commentId } = req.params
    const { user } = req.body

    if (!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "Comment Does Not Exist")
    }

    const isLike = await Like.findOne({
        comment: commentId,
        likedBy: user._id
    })

    if(isLike) {
        await Like.deleteOne({_id: isLike._id})

        const like = await Like.findById(isLike._id)

        if (like){
            throw new ApiError(500, "Error while toggling the like of video")
        }
    }
    else {
        const like = await Like.create({
            comment: commentId,
            likedBy: user._id
        })

        if (!like){
            throw new ApiError(500, "Error while toggling the like of video")
        }
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "", "Like is Successfully toggled")
    )
})

const toggleTweetLike = asyncHandler( async( req, res) => {
    const { tweetId } = req.params
    const { user } = req.body

    if (!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "Tweet Does Not Exist")
    }

    const isLike = await Like.findOne({
        tweet: tweetId,
        likedBy: user._id
    })

    if(isLike) {
        await Like.deleteOne({_id: isLike._id})

        const like = await Like.findById(isLike._id)

        if (like){
            throw new ApiError(500, "Error while toggling the like of video")
        }
    }
    else {
        const like = await Like.create({
            tweet: tweetId,
            likedBy: user._id
        })

        if (!like){
            throw new ApiError(500, "Error while toggling the like of video")
        }
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "", "Like is Successfully toggled")
    )
})

const getLikedVideos = asyncHandler( async( req, res) => {
    const { userId } = req.user._id

    if( !mongoose.isValidObjectId(userId) ) {
        throw new ApiError(400, "Invalud Mongoose Object Id")
    }

    const likedVideos =  await Like.find({likedBy: userId})

    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideos, "Liked Videos Fetched Successfully")
    )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleCommentLike,
    getLikedVideos
}