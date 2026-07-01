import Video from "../models/Video.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { timeId } from "../services/idService.js";

// GET /api/videos
export const getVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find().sort({ createdAt: -1 });
  res.json(videos.map((v) => v.toJSON()));
});

// POST /api/videos
export const createVideo = asyncHandler(async (req, res) => {
  const video = await Video.create({
    title: "",
    caption: "",
    src: "",
    poster: "",
    ...req.body,
    id: req.body.id || timeId("v"),
  });
  res.status(201).json(video.toJSON());
});

// DELETE /api/videos/:id
export const deleteVideo = asyncHandler(async (req, res) => {
  const video = await Video.findOneAndDelete({ id: req.params.id });
  if (!video) return res.status(404).json({ error: "Video not found." });
  res.json({ ok: true });
});
