import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler"
import { ApiError } from "../utils/ApiError"
import { Playlist } from "../models/playlist.model"
import { ApiResponse } from "../utils/ApiResponse"
import { Video } from "../models/video.model"

const createPlaylist = asyncHandler( async( req, res) => {
    const { name, description } = req.body
    const userId = req.user._id
    
    if( !name ) {
        throw new ApiError("400", "Name Is Required")
    }

    const playList = await Playlist.create({
        name: name,
        description: description,
        owner: userId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, playList, "PlayList Created Successfully")
    )
})

const getUserPlaylists = asyncHandler( async( req, res) => {
    const userId = req.params
    
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }

    const playLists = await Playlist.find({
        owner: userId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, playLists, "User PlayList Fectched Successfully")
    )
})

const getPlaylistById = asyncHandler( async( req, res) => {
    const playlistId = req.params

    if(!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid mongoose Object Id")
    }

    const playlist = await Playlist.findOne({_id: playlistId})

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist Fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler( async( req, res) => {
    const { playlistId, videoId } = req.params
    const userId = req.user._id

    if(!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }

    const playlist = await Playlist.findById(playlistId)
    const video = await Video.findById(videoId)

    if(!playlist || !video) {
        throw new ApiError(404, "Playlist or Video Does Not Exist")
    }

    if(playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not Authrozied to Add Video to This Playlist")
    }

    try {
        const updatePlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $addToSet: {
                    video: videoId
                }
            },
            {
                new: true
            }
        )

        if (!updatePlaylist) {
            throw new ApiError(404, "Playlist Does Not Updated")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, updatePlaylist, "Video Added to the Playlist Successsfully")
        )
    }
    catch(error) {
        console.log(error)
        throw new ApiError(505, "Error while updating Playlist")
    }

})

const removeVideoFromPlaylist = asyncHandler( async( req, res) => {
    const { playlistId, videoId } = req.params
    const userId = req.user._id

    if(!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }

    const playlist = await Playlist.findById(playlistId)
    const video = await Video.findById(videoId)

    if(!playlist || !video) {
        throw new ApiError(404, "Playlist or Video Does Not Exist")
    }

    if(playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not Authrozied to Remove Video from this Playlist")
    }

    try {
        const updatePlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $pull: {
                    video: videoId
                }
            },
            {
                new: true
            }
        )

        if (!updatePlaylist) {
            throw new ApiError(404, "Playlist Does Not Get Updated")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, updatePlaylist, "Video Removed From the Playlist Successsfully")
        )
    }
    catch(error) {
        console.log(error)
        throw new ApiError(505, "Error while Removing Video From Playlist")
    }

})

const deletePlaylist = asyncHandler( async( req, res) => {
    const { playlistId } = req.params
    const userId = req.user._id

    if(!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist ) {
        throw new ApiError(404, "Playlist Does Not Exist")
    }

    if(playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not Authrozied to Delete this Playlist")
    }

    await Playlist.findByIdAndDelete(playlistId)

    const isPlayListExist = await Playlist.findById(playlistId)

    if(isPlayListExist) {
        throw new ApiError(500, "PlayList Still Exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "", "PlayList Deleted Successfully")
    )
})

const updatePlaylist = asyncHandler( async( req, res) => {
    const playlistId = req.params
    const { name, description } = req.body
    const userId = req.user._id

    if(!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid Mongoose Object Id")
    }
    const playlist = await Playlist.findById(playlistId)

    if(playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(405, "You are not authorized to update this playlist")
    }

    try {
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name: name,
                    description: description
                }
            },
            {
                new: true
            }
        )

        if(!updatedPlaylist) {
            throw new ApiError(500, "Playlist name or Description does not get updated")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully")
        )

    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Error while updating the playlist")
    }



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