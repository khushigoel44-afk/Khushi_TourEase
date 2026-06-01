const Document = require("../models/Document");
const { cloudinary } = require("../config/cloudinary");

// Get all documents for the logged-in user
// Supports optional ?category= query param filter
exports.getDocuments = async (req, res, next) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const documents = await Document.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, documents });
  } catch (error) {
    next(error);
  }
};

// Get a single document by ID (scoped to user)
exports.getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found or access denied.",
      });
    }

    res.json({ success: true, document });
  } catch (error) {
    next(error);
  }
};

// Upload a new document
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please select a file.",
      });
    }

    const { name, category, notes, tags } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a document name.",
      });
    }

    // Parse tags — accept comma-separated string or JSON array
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }
    }

    const newDocument = new Document({
      userId: req.user.id,
      name: name.trim(),
      category: category || "Other",
      fileUrl: req.file.path,
      publicId: req.file.filename,
      fileType: req.file.mimetype || "application/octet-stream",
      fileSize: req.file.size || 0,
      notes: notes ? notes.trim() : "",
      tags: parsedTags,
    });

    await newDocument.save();
    res.status(201).json({ success: true, document: newDocument });
  } catch (error) {
    next(error);
  }
};

// Update document metadata (name, category, notes, tags)
exports.updateDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found or access denied.",
      });
    }

    const { name, category, notes, tags } = req.body;

    if (name !== undefined) document.name = name.trim();
    if (category !== undefined) document.category = category;
    if (notes !== undefined) document.notes = notes.trim();
    if (tags !== undefined) {
      document.tags = Array.isArray(tags)
        ? tags
        : tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
    }

    await document.save();
    res.json({ success: true, document });
  } catch (error) {
    next(error);
  }
};

// Delete a document (from Cloudinary + MongoDB)
exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found or access denied.",
      });
    }

    // Delete file from Cloudinary
    try {
      // Determine resource type based on file type
      const resourceType = document.fileType.startsWith("image/")
        ? "image"
        : "raw";
      await cloudinary.uploader.destroy(document.publicId, {
        resource_type: resourceType,
      });
    } catch (cloudErr) {
      console.error("Cloudinary deletion error:", cloudErr.message);
      // Continue to delete the DB record even if Cloudinary fails
    }

    await Document.findByIdAndDelete(document._id);
    res.json({ success: true, message: "Document deleted successfully." });
  } catch (error) {
    next(error);
  }
};
