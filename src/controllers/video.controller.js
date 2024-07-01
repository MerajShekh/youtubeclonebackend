import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 2, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const pipeline = [];

  if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"],
        },
      },
    });
  }

  if (userId) {
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid userId");

    pipeline.push({
      $match: {
        user: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  pipeline.push({
    $match: {
      isPublished: true,
    },
  });

  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: "$owner",
      },
    }
  );

  const videoAggregate = Video.aggregate([pipeline]);

  const user = await Video.aggregatePaginate(videoAggregate, { page, limit });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Data fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  const videoLocalPath = req.files?.videoFile?.[0].path ?? null;
  const thumbnailLocalPath = req.files?.thumbnail?.[0].path ?? null;

  if (!videoLocalPath) throw new ApiError(400, "Video is required");
  if (!thumbnailLocalPath)
    throw new ApiError(400, "thumbnail image is required");

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const videoFile = await uploadOnCloudinary(videoLocalPath);

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: videoFile.duration,
    title,
    description,
    owner: req.user?._id,
  });

  if (!video)
    throw new ApiError(500, "Something went wrong while uploading video");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId) throw new ApiError(400, "videoId is required");
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId");

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        foreignField: "video",
        localField: "_id",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        foreignField: "video",
        localField: "_id",
        as: "comments",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        likeCount: {
          $size: "$likes",
        },
        commentCount: {
          $size: "$comments",
        },
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, video, ""));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  //TODO: update video details like title, description, thumbnail
  if (!videoId) throw new ApiError(400, "videoId is required");
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId");

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $set: { title, description } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video detail updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!videoId) throw new ApiError(400, "videoId is required");
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId");
  try {
    await Video.findByIdAndDelete(videoId);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video deleted successfully"));
  } catch (error) {
    throw new ApiError(500);
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) throw new ApiError(404, "Video not found");

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video Publish status updated"));
});

const updateVideoViews = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const watchedHistoryEntry = user.watchHistory.find(
    (entry) => entry.video.toString() === videoId
  );

  if (!watchedHistoryEntry) {
    // User has not watched this video before
    // increment views count

    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    // Add to the watch history
    user.watchHistory.push({
      video: videoId,
      watchedAt: new Date(),
    });

    await user.save();
  } else {
    // User has watched this video before, just update the watchedAt
    watchedHistoryEntry.watchedAt = new Date();
    await user.save();
  }

  return res.status(200).json(new ApiResponse(200, {}, "Video views updated"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  updateVideoViews,
};
