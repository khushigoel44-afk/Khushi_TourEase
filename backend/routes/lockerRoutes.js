const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
  getDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
} = require("../controllers/lockerController");

// All locker routes require authentication
router.use(verifyToken);

// Document CRUD
router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.post("/upload", upload.single("file"), uploadDocument);
router.patch("/:id", updateDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
