import mongoose from "mongoose";
import { Comment } from "../models/comment.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Video } from "../models/video.model";
import { ApiResponse } from "../utils/ApiResponse";

const getVideoComments = asyncHandler( async(req, res) => {

    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Invalid Video Id");
    }

    const videoCommentQuery = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },

        {
            $lookup: {
                from : "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },

        {
            $project: {
                userName: 1,
                avatar: 1
            }
        }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const videoComments = await Comment.aggregatePaginate(videoCommentQuery, options)

    return res
    .status(200)
    .json(
        new ApiResponse(200, videoComments, "Comments Fetched Successfully")
    )
})


const addComment = asyncHandler( async(req, res) => {
    const { videoId } = req.params
    const { user } = req.user
    const { content } = req.body

    if (!mongoose.isValidObjectId(videoId) ) {
        throw new ApiError(400, "Invalid Mongoose Video Object Id");
    }

    if ( !user || !content){
        throw new ApiError(404, "User or Content Not Found")
    }

    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: user?._id
    })

    const commentCreated = await Comment.findById(comment._id);

    if (!commentCreated) {
        throw new ApiError(500, "Something went wrong while creating comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, commentCreated, "Comment Added Successfully")
    )
})


const updateComment = asyncHandler( async(req, res) => {
    const { videoId } = req.params
    const { user } = req.user
    const { content } = req.body

    if (!mongoose.isValidObjectId(videoId) ) {
        throw new ApiError(400, "Invalid Mongoose Video Object Id");
    }

    if ( !user || !content){
        throw new ApiError(404, "User or Content Not Found")
    }

    const comment = await Comment.findOne({ 
        video: videoId,
        owner: user._id 
    })


    if (!comment) {
        throw new ApiError(400, "Comment Does Not Exist")
    }

    comment.content = content

    const updatedComment = await comment.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(
        new ApiResponse(200, updateComment, "Comment updated Successfully")
    )
})


const deleteComment = asyncHandler( async(req, res) => {
    const { videoId } = req.params
    const { user } = req.user

    if (!mongoose.isValidObjectId(videoId) ) {
        throw new ApiError(400, "Invalid Mongoose Video Object Id");
    }

    if ( !user ){
        throw new ApiError(404, "User or Content Not Found")
    }

    const deletedComment = await Comment.deleteOne({ 
        video: videoId,
        owner: user._id 
    })


    if (deletedComment.deletedCount === 0) {
        throw new ApiError(400, "Comment Does Not Exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deletedComment, "Comment Deleted Successfully")
    )

})


export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}