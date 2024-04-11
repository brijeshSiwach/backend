import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";


const healtCheck = asyncHandler( async (req, res) => {
    try {
        return res
        .status(200)
        .json(
            new ApiResponse(200, "", "Health is Good")
        )
    } catch (error) {
        console.log(error)
        throw new ApiError(400, "Health is Not Good")
    }
})

export {
    healtCheck
}

