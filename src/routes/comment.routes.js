import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyToken); // Apply verifyToken middleware to all routes in this file

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/comment/:commentId").delete(deleteComment).patch(updateComment);

export default router;
