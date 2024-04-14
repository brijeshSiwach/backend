import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { Subscription } from "../models/subscriptions.model";
import { ApiResponse } from "../utils/ApiResponse";

const toggleSubscription = asyncHandler( async(req, res) => {
    const channelId = req.params
    const userId = req.user._id

    if(!isValidObjectId(channelId) || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invaid Mongoose Object Id")
    }

    const userChannel = await User.findById(channelId)
    if(!userChannel) {
        throw new ApiError(404, "Channle does Not Exist")
    }
    const isSubscibed = await Subscription.findOne({
        channel: channelId,
        subsciber: userId
    })

    if(isSubscibed) {
        await Subscription.findByIdAndDelete(isSubscibed._id)

        const subscribed = await Subscription.findById(isSubscibed._id)
        if(subscribed) {
            throw new ApiError(500, "Error While Toggling the channel")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, "", "Channel Unsubscribed Successfully")
        )
    }
    else {
        const updateSubscription = await Subscription.create({
            channel: channelId,
            subsciber: userId
        })

        if(!updateSubscription) {
            throw new ApiError(500, "Error while subscribing the Channel")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, updateSubscription, "Channel Subscribed Successfully")
        )
    }
})

const getUserChannelSubscribers = asyncHandler( async(req, res) => {
    const channelId = req.params
    const userId = req.user._id

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invaid Mongoose Object Id")
    }

    if(channelId.toString() !== userId.toString()) {
        throw new ApiError(405, "You are not authorized to access the subscibers list")
    }

    const subscribers = await Subscription.find({channel: channelId}).select("-createdAt -updatedAt -channel")

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers, "Subscribers Fetched Successfullly")
    )
})

const getSubscibedChannels = asyncHandler( async(req, res) => {
    const subsciberId = req.params
    const userId = req.user._id

    if(!isValidObjectId(subsciberId)) {
        throw new ApiError(400, "Invaid Mongoose Object Id")
    }

    if(subsciberId.toString() !== userId.toString()) {
        throw new ApiError(405, "You are not authorized to access the subscibered channel list")
    }

    const channels = await Subscription.find({subsciber: subsciberId}).select("-createdAt -updatedAt -subscriber")

    return res
    .status(200)
    .json(
        new ApiResponse(200, channels, "Channels Fetched Successfullly")
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscibedChannels
}