import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
    commentId: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },

    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },

    tweet: {
        type: Schema.Types.ObjectId,
        ref: "tweet"
    },

    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true })


export const Like = mongoose.model("Like", likeSchema)