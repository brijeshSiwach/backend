import mongoose from "mongoose";
import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Tweet } from "../models/tweet.model";
import { Comment } from "../models/comment.model";
import { Like } from "../models/like.model";
import { Subscription } from "../models/subscriptions.model";
import { ApiResponse } from "../utils/ApiResponse";


const getChannelStats = asyncHandler( async(req, res) => {

    try {
        // get total videos, total likes, total views, total subscribers
    
        const channelId = req.user._id
    
        // get total videos
        const totalVideos = await Video.find({ owner : channelId })
        const channelVideoId = totalVideos.map(video => video._id)
    
        // get total tweets
        const totalTweets = await Tweet.find({ owner : channelId })
        const channelTweetsId = totalTweets.map(tweet => tweet._id)
    
        // get total Comments
        const totalComments = await Comment.find({ owner : channelId })
        const channelCommentsId = totalComments.map(comment => comment._id)
        
        // get total views
        const totalViews = await Video.aggregate([
            {
                $match: { 
                    owner: new mongoose.Types.ObjectId(channelId)
                }
            },
    
            {
                $group :{
                    totalViews : { $sum : "$views" }
                }
            }
        ])
    
        // get total likes
        const totalVideoLikes = await Like.countDocuments({ video : { $in: channelVideoId }})
        const totalCommentLikes = await Like.countDocuments({ commentId: { $in: channelCommentsId }})
        const totalTweetLikes = await Like.countDocuments({ tweet : { $in: channelTweetsId }})
    
        // get total subscriber
        const totalSubscriber = await Subscription.countDocuments({ channel : channelId })
    
        //get total subscribed channel
        const totalsubscribed = await Subscription.countDocuments({ user : channelId })
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, {
                totalVideoLikes,
                totalCommentLikes,
                totalTweetLikes,
                totalViews,
                totalSubscriber,
                totalsubscribed
            }, "Channel Stats Recieved Successfully")
        )
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Error in Retrieving Channel Stats")
    }

})

const getChannelVideos = asyncHandler( async(req, res) => {
    const channelId = req.user._id

    if(!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Monggose ObjectId")
    }

    const channelVideos = await Video.find({ owner : channelId })

    return res
    .status(200)
    .json(
        new ApiResponse(200, channelVideos, "Channel Videos Retrieved Successfullu")
    )
})  

export  {
    getChannelStats,
    getChannelVideos
}