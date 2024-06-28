import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUser,
  changeProfileImage,
  changeCoverImage,
  getUserProfile,
  getWatchedHistory,
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secure routes
router.route("/logout").post(verifyToken, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyToken, changePassword);
router.route("/current-user").get(verifyToken, getCurrentUser);
router.route("/update-user").patch(verifyToken, updateUser);
router
  .route("/avatar")
  .patch(verifyToken, upload.single("avatar"), changeProfileImage);
router
  .route("/cover-image")
  .patch(verifyToken, upload.single("coverImage"), changeCoverImage);
router.route("/channel/:username").get(verifyToken, getUserProfile);
router.route("/watched-history").get(verifyToken, getWatchedHistory);

export default router;
