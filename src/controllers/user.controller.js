import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { unLink } from "../utils/unLink.js";

const registerUser = asyncHandler( async (req, res) => {
    const { fullName, email, userName, password } = req.body;
    console.log("email: ", email)

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

export { 
    registerUser,
}