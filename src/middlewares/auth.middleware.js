import jwt  from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const verifyJWT = asyncHandler( async (req, res, next) => {
    try {
        console.log(req.cookies)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        
        if (!token) {
            throw new ApiError(401, "Unauthorized Request")
        }
        
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
    
        if(!user) {
            throw new ApiResponse(401, "Invalid Access Token")
        }
        
        // Add  the new field req.user in request sent by the user
        
        req.user = user; 
        next()
    } catch (error) {

        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})