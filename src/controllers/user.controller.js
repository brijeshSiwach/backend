import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { unLink } from "../utils/unLink.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {

    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Token");
    }
}

const registerUser = asyncHandler( async (req, res) => {
    const { fullName, email, userName, password } = req.body;

    if (fullName === ""){
        throw new ApiError(400, "fullname is required")
    }
    if (email === ""){
        throw new ApiError(400, "email is required")
    }
    if (userName === ""){
        throw new ApiError(400, "userName is required")
    }
    if (password === ""){
        throw new ApiError(400, "password is required")
    }


    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File is required");
    }


    let coverImageLocalPath = null;
    if (req.files && ("coverImage" in req.files)){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    const existedUser = await User.findOne({
        
        $or: [{ email }, { userName }]
    })


    if (existedUser) {
        unLink(avatarLocalPath);
        unLink(coverImageLocalPath);
        throw new ApiError(409, "User with email or username already existed");
    }

    // console.log(coverImageLocalPath);

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }
    // console.log(coverImage)
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )

})

const loginUser = asyncHandler( async (req, res) => {
    const  {email, userName, password } = req.body


    if (!(userName || email)) {
        throw new ApiError(400, "username or email is required");
    }
    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })
    
    if (!user) {
        throw new ApiError(404, "user does not exist")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password);
    
    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect Password")
    }
    
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    
    const options = {
        httpOnly: true,
    }
    

    const response = res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, 
            accessToken, 
            refreshToken
        },"User Logged in Successfullty")
    )

    return response
})

const logoutUser = asyncHandler( async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
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
    
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User Logged Out Successfully")
    )
})

const refreshAccessToken = asyncHandler( async (req, res) => {

    let userRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!userRefreshToken){
        throw new ApiError(401, "Unauthroized Request");
    }

    try {
        const decodedToken = jwt.verify(userRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        

        const user = await User.findById(decodedToken?._id);


        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }
    
        if ( user?.refreshToken !== userRefreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used");
        }
    
        const options = {
            httpOnly: true,
        }
    
        const { accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                "Access Token Refreshed Created Successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }
})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid New Password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(200, "", "Password Changed Succesfully")
    )
})
 
const getCurrentUser = asyncHandler( async (req, res) => {

    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Current User fetched Successfully")
    )
})

const updateAccountDetails = asyncHandler( async (req, res) => {
    const { fullName, email } = req.body;

    if ( !fullName || !email ) {
        throw new ApiError(400, "All Fields are Required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password");
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account Details updated Successfully")
    )
})


const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath  = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File is Missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    
    if (!avatar.url) {
        throw new ApiError(400, "Error While uploading Avatar")
    }
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")
        
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar Updated Successfully")
    )
})

const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverLocalPath  = req.file?.path;

    if (!coverLocalPath) {
        throw new ApiError(400, "Cover Image File is Missing")
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error While uploading coverImage")
    }
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")
        

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image Updated Successfully")
    )
})

const getUserChannelProfile = asyncHandler( async(req, res) => {
    let { userName } = req.params

    // userName = userName.replace(":","");

    if (!userName?.trim) {
        throw new ApiError(400, "Username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },

        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },

        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberedTo"
            }
        },

        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },

                subscribedToCount: {
                    $size: "$subscriberedTo"
                },

                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else:  false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }

        }
    ])

    // console.log(channel);
    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User Channel Retrieved Successfully")
    )
})

const getWatchHistory  = asyncHandler( async(req, res) => {
    

    const user = await User.aggregate([
        {
            $match: {
                _id: req.user._id 
            },
        },

        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    // console.log(user)
    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch History fetched Successfully")
    )
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}