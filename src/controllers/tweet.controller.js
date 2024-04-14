import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Tweet } from "../models/tweet.model";
import { ApiResponse } from "../utils/ApiResponse";

const createTweet = asyncHandler( async(req, res) => {
    const userId = req.user._id
    const content = req.body

    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid Mongoose ObjectId")
    }

    if(!content) {
        throw new ApiError(404, "Content is Required")
    }

    const tweet = await Tweet.create({
        content: content,
        owner: userId
    })

    if(!tweet) {
        throw new ApiError(500, "Error while creating tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet is Created Successfully")
    )
})

const getUserTweets = asyncHandler( async(req, res) => {
    const userId = req.params

    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid Mongoose ObjectId")
    }

    const userTweets = await Tweet.find({ owner: userId })

    return res
    .status(200)
    .json(
        new ApiResponse(200, userTweets, "User Tweets is Fetched Successfully")
    )
})

const updateTweet = asyncHandler( async(req, res) => {
    const userId = req.user._id
    const content = req.body
    const tweetId = req.params

    if(!isValidObjectId(userId) || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Mongoose ObjectId")
    }

    if(!content) {
        throw new ApiError(404, "Content is Required")
    }

    const isTweetExist = await Tweet.findById(tweetId)
    
    if(!isTweetExist) {
        throw new ApiError(404, "Tweet Does Not Exist")
    }

    if(isTweetExist.owner.toString() !== userId.toString()) {
        throw new ApiError(405, "You are Not Authorized to update this Tweet")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content
            }
        },
        {
            new: true
        }
    )

    if(!tweet) {
        throw new ApiError(500, "Error while Updating tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet is Updated Successfully")
    )
})

const deleteTweet = asyncHandler( async(req, res) => {
    const userId = req.user._id
    const tweetId = req.params

    if(!isValidObjectId(userId) || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Mongoose ObjectId")
    }

    const isTweetExist = await Tweet.findById(tweetId)
    
    if(!isTweetExist) {
        throw new ApiError(404, "Tweet Does Not Exist")
    }

    if(isTweetExist.owner.toString() !== userId.toString()) {
        throw new ApiError(405, "You are Not Authorized to update this Tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)
    const tweet = await Tweet.findById(tweetId)
    
    if(tweet) {
        throw new ApiError(500, "Error while Deleting tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet is Deleted Successfully")
    )
})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
}