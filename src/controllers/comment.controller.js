import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId");

  const videoAggregate = Comment.findOne({ video: videoId });
  const video = await Comment.aggregatePaginate(videoAggregate, {
    page,
    limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  const comment = await Comment.create({
    video: videoId,
    content,
    owner: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid commentId");

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { content } },
    { new: true, runValidators: true }
  );

  if (!comment) throw new ApiError(400, "Comment not found");

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid commentId");

  const deletedComment = await Comment.findByIdAndDelete(commentId);
  if (!deletedComment) throw new ApiError(400, "Comment not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
