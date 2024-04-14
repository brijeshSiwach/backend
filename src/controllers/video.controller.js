import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";

const getAllVideos = asyncHandler( async(req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query
    const userId = req.user?._id


    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortBy 
        ? { [ sortBy ] : sortType === "desc" ? -1 : 1}
        : {createdAt: -1}
    }   

    const conditions = {}

    if(query) {
        conditions.title = { $regex: query, $options: "i"}
        conditions.description = { $regex: query, $options: "i"}
    }   

    if(userId) {
        conditions.owner = userId
    }
    const videos = await Video.aggregatePaginate(conditions, options)

    if(!videos) {
        throw new ApiError(500, "Error in fetching Videos")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "Videos Fetched Successfully")
    )
})

const publishAVideo = asyncHandler( async(req, res) => {
    const { title, description } = req.body
    const userId = req.user._id

    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }

    if( !title || !description) {
        throw new ApiError(400, "Title and Desciption is required");
    }

    const videoFileLocalPath = req.files?.video[0]?.path;
    const thumbNailLocalPath = req.files?.thumbNail?.path;

    if (!videoFileLocalPath || !thumbNailLocalPath) {
        throw new ApiError(400, "Video and ThumbNail are Required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbNail = await uploadOnCloudinary(thumbNailLocalPath)

    const duration = videoFile?.duration

    if(!videoFile || !thumbNail) {
        throw new ApiError(500, "Error while uploading video or thumbnail")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbNail: thumbNail.url,
        title,
        description,
        duration,
        owner: userId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video Uploaded Successfully")
    )
})

const getVideoById = asyncHandler( async(req, res) => {
    const videoId = req.params

    if(isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }

    const video = await Video.findById(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video Fetched Successfully")
    )
}) 


const updateVideo = asyncHandler( async(req, res) => {
    const { title, description } = req.body
    const videoId = req.params
    const userId = req.user._id

    if(!isValidObjectId(videoId) || !isValidObjectId(userId)){
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }

    const video = await Video.findById(videoId)

    if( !video ){
        throw new ApiError(404, "Video Not Found")
    }

    if(video.owner.toString() !== userId.toString()) {
        throw new ApiError(405,"You cannot update this video")
    }

    const thumbNailLocalPath = req.file?.path

    if(!thumbNailLocalPath) {
        throw new ApiError(404, "ThumNail Not Found")
    }

    const thumbNail = await uploadOnCloudinary(thumbNailLocalPath)

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbNail: thumbNail.url,
                title : title ? title : video.title,
                description: description ? description : video.description,
            }
        },
        {
            new: true
        }
    )

    if(!updatedVideo) {
        throw new ApiError(500, "Error while updating the Video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Video is updated Successfully")
    )

})

const deleteVideo = asyncHandler( async(req, res) => {
    const videoId = req.params
    const userId = req.user._id

    if(!isValidObjectId(videoId) || !isValidObjectId(userId)){
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }

    const video = await Video.findById(videoId)
    if( !video ){
        throw new ApiError(404, "Video Not Found")
    }

    if(video.owner.toString() !== userId.toString()) {
        throw new ApiError(405,"You cannot Delete this video")
    }

    await Video.findByIdAndDelete(videoId)
    const isExist = await Video.findById(videoId)

    if(isExist){
        throw new ApiError(500, "Video is not Deleted Successfully")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "" , "Video is Deleted Successfully")
    )
})

const togglePublishStatus = asyncHandler( async(req, res) => {
    const videoId = req.params
    const userId = req.user._id

    if(!isValidObjectId(videoId) || !isValidObjectId(userId)){
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }

    const video = await Video.findById(videoId)
    if( !video ){
        throw new ApiError(404, "Video Not Found")
    }

    if(video.owner.toString() !== userId.toString()) {
        throw new ApiError(405,"You cannot Delete this video")
    }

    const isPublishedToogled = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                published: video.published ? false : true
            }
        },
        {
            new: true
        }
    )

    if(!isPublishedToogled) {
        throw new ApiError(500, "Published Status is not Toggled")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, isPublishedToogled , "Video Published Status is Toggled Successfully")
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}