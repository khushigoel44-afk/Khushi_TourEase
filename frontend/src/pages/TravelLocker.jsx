import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Upload,
  FileText,
  Trash2,
  Eye,
  Tag,
  FolderOpen,
  X,
  RefreshCw,
  Image,
  File,
  ShieldCheck,
  Plane,
  CreditCard,
  HeartPulse,
  Stamp,
  CalendarDays,
  Plus,
  Search,
  Edit3,
  Check,
  CloudUpload,
} from "lucide-react";

// ═══════════════════════════════════════════════════
// CATEGORY CONFIGURATION
// ═══════════════════════════════════════════════════
const CATEGORIES = [
  {
    name: "Passport",
    icon: ShieldCheck,
    color: "bg-blue-500",
    lightBg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  {
    name: "Ticket",
    icon: Plane,
    color: "bg-teal-500",
    lightBg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-600 dark:text-teal-400",
  },
  {
    name: "Insurance",
    icon: ShieldCheck,
    color: "bg-emerald-500",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "Visa",
    icon: Stamp,
    color: "bg-purple-500",
    lightBg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-600 dark:text-purple-400",
  },
  {
    name: "Booking",
    icon: CalendarDays,
    color: "bg-amber-500",
    lightBg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  {
    name: "Medical",
    icon: HeartPulse,
    color: "bg-rose-500",
    lightBg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-600 dark:text-rose-400",
  },
  {
    name: "Other",
    icon: FolderOpen,
    color: "bg-slate-500",
    lightBg: "bg-slate-50 dark:bg-slate-800/40",
    text: "text-slate-600 dark:text-slate-400",
  },
];

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const isImageType = (fileType) => {
  return fileType && fileType.startsWith("image/");
};

const getCategoryConfig = (categoryName) => {
  return CATEGORIES.find((c) => c.name === categoryName) || CATEGORIES[6];
};

// ═══════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════
export default function TravelLocker() {
  const { showToast } = useToast();

  // Data state
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null); // null = All
  const [searchQuery, setSearchQuery] = useState("");

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Other");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Preview modal state
  const [previewDoc, setPreviewDoc] = useState(null);

  // Edit state (inline)
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const fileInputRef = useRef(null);

  // ─────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getLockerDocuments(activeCategory);
      if (res.success) {
        setDocuments(res.documents || []);
      }
    } catch (err) {
      showToast(err.message || "Failed to load documents.", "error");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, showToast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ─────────────────────────────────────────────────
  // SEARCH FILTER (client-side)
  // ─────────────────────────────────────────────────
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      (doc.notes && doc.notes.toLowerCase().includes(q)) ||
      (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  // ─────────────────────────────────────────────────
  // UPLOAD HANDLERS
  // ─────────────────────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("File size must be under 10 MB.", "error");
      return;
    }
    setUploadFile(file);
    if (!uploadName.trim()) {
      // Auto-fill name from filename (strip extension)
      setUploadName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      showToast("Please select a file to upload.", "error");
      return;
    }
    if (!uploadName.trim()) {
      showToast("Please enter a document name.", "error");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", uploadName.trim());
      formData.append("category", uploadCategory);
      formData.append("notes", uploadNotes.trim());
      formData.append("tags", uploadTags.trim());

      const res = await api.uploadLockerDocument(formData);

      if (res.success) {
        showToast("Document uploaded successfully!", "success");
        setDocuments((prev) => [res.document, ...prev]);
        resetUploadForm();
        setShowUploadModal(false);
      }
    } catch (err) {
      showToast(err.message || "Upload failed.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadName("");
    setUploadCategory("Other");
    setUploadNotes("");
    setUploadTags("");
    setIsDragging(false);
  };

  // ─────────────────────────────────────────────────
  // EDIT HANDLER
  // ─────────────────────────────────────────────────
  const handleStartEdit = (doc) => {
    setEditingId(doc._id);
    setEditName(doc.name);
    setEditCategory(doc.category);
  };

  const handleSaveEdit = async (docId) => {
    try {
      const res = await api.updateLockerDocument(docId, {
        name: editName.trim(),
        category: editCategory,
      });
      if (res.success) {
        setDocuments((prev) =>
          prev.map((d) => (d._id === docId ? res.document : d))
        );
        showToast("Document updated.", "success");
      }
    } catch (err) {
      showToast(err.message || "Update failed.", "error");
    } finally {
      setEditingId(null);
    }
  };

  // ─────────────────────────────────────────────────
  // DELETE HANDLER
  // ─────────────────────────────────────────────────
  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this document permanently? This cannot be undone.")) return;

    try {
      const res = await api.deleteLockerDocument(docId);
      if (res.success) {
        setDocuments((prev) => prev.filter((d) => d._id !== docId));
        showToast("Document deleted.", "success");
        if (previewDoc && previewDoc._id === docId) {
          setPreviewDoc(null);
        }
      }
    } catch (err) {
      showToast(err.message || "Deletion failed.", "error");
    }
  };

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ══════════════════════════════════════════ */}
        {/* HEADER */}
        {/* ══════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-linear-to-r from-teal-600 to-cyan-500 dark:from-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
              <Lock className="w-9 h-9 text-teal-600 dark:text-cyan-400" />
              Travel Locker
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Your secure digital vault for travel documents — passports, tickets, insurance, and more.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            id="upload-document-btn"
            className="self-start md:self-auto flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold px-5 py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        </div>

        {/* ══════════════════════════════════════════ */}
        {/* SEARCH + CATEGORY FILTER BAR */}
        {/* ══════════════════════════════════════════ */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by name, tag, or notes..."
              id="search-documents"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md focus:outline-hidden focus:border-teal-500 text-sm transition"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeCategory === null
                  ? "bg-teal-500 text-white shadow-md"
                  : "bg-white/80 dark:bg-gray-900/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.name}
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === cat.name ? null : cat.name
                    )
                  }
                  className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    activeCategory === cat.name
                      ? `${cat.color} text-white shadow-md`
                      : "bg-white/80 dark:bg-gray-900/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════ */}
        {/* DOCUMENT GRID or EMPTY/LOADING STATE */}
        {/* ══════════════════════════════════════════ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-12 h-12 text-teal-500 animate-spin" />
            <p className="mt-4 text-slate-500">Loading your documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
            <div className="w-20 h-20 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FolderOpen className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">
              {searchQuery.trim()
                ? "No documents match your search"
                : activeCategory
                ? `No ${activeCategory} documents yet`
                : "Your Travel Locker is empty"}
            </h3>
            <p className="text-slate-400 dark:text-slate-500 mt-2 max-w-md mx-auto">
              {searchQuery.trim()
                ? "Try a different search term or clear your filters."
                : "Upload your travel documents to keep them organized and accessible anywhere."}
            </p>
            {!searchQuery.trim() && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-5 inline-flex items-center gap-2 text-teal-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Upload your first document
              </button>
            )}
          </div>
        ) : (
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {filteredDocuments.map((doc) => {
              const cat = getCategoryConfig(doc.category);
              const CatIcon = cat.icon;
              const isEditing = editingId === doc._id;

              return (
                <motion.div
                  key={doc._id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="group bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-teal-200 dark:hover:border-teal-900/60 transition-all duration-300 overflow-hidden"
                >
                  {/* Thumbnail / File type banner */}
                  <div
                    className="relative h-40 bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center cursor-pointer overflow-hidden"
                    onClick={() => setPreviewDoc(doc)}
                  >
                    {isImageType(doc.fileType) ? (
                      <img
                        src={doc.fileUrl}
                        alt={doc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-14 h-14 text-slate-300 dark:text-slate-600" />
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                          {doc.fileType ? doc.fileType.split("/")[1] : "FILE"}
                        </span>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDoc(doc);
                          }}
                          className="p-2.5 bg-white/90 dark:bg-gray-800/90 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white transition shadow-lg cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc._id);
                          }}
                          className="p-2.5 bg-white/90 dark:bg-gray-800/90 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition shadow-lg cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Category badge */}
                    <div className={`absolute top-3 right-3 ${cat.lightBg} ${cat.text} px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1`}>
                      <CatIcon className="w-3 h-3" />
                      {doc.category}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-teal-300 dark:border-teal-700 bg-transparent text-sm font-semibold focus:outline-hidden"
                          autoFocus
                        />
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSaveEdit(doc._id)}
                          className="flex items-center gap-1 text-sm text-teal-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate text-sm">
                            {doc.name}
                          </h3>
                          <button
                            onClick={() => handleStartEdit(doc)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-teal-600 cursor-pointer shrink-0"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                        </div>
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {doc.tags.length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{doc.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Stats bar */}
        {!loading && documents.length > 0 && (
          <div className="mt-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-cyan-400 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Total Documents</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{documents.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                  <Image className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Images</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {documents.filter((d) => isImageType(d.fileType)).length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
                  <File className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Files</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {documents.filter((d) => !isImageType(d.fileType)).length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Categories Used</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {new Set(documents.map((d) => d.category)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* UPLOAD MODAL */}
      {/* ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                if (!isUploading) {
                  setShowUploadModal(false);
                  resetUploadForm();
                }
              }}
            />
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-[5vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 w-auto sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl"
            >
              <div className="p-6">
                {/* Modal header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <CloudUpload className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
                    Upload Document
                  </h2>
                  <button
                    onClick={() => {
                      if (!isUploading) {
                        setShowUploadModal(false);
                        resetUploadForm();
                      }
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleUploadSubmit} className="space-y-5">
                  {/* Drag & Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                      isDragging
                        ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20"
                        : uploadFile
                        ? "border-emerald-300 bg-emerald-50/30 dark:border-emerald-700 dark:bg-emerald-950/10"
                        : "border-slate-300 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 bg-slate-50/50 dark:bg-slate-800/30"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    />
                    {uploadFile ? (
                      <div className="flex flex-col items-center gap-2">
                        {isImageType(uploadFile.type) ? (
                          <Image className="w-10 h-10 text-emerald-500" />
                        ) : (
                          <FileText className="w-10 h-10 text-emerald-500" />
                        )}
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {uploadFile.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatFileSize(uploadFile.size)} • Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Drag & drop your file here, or{" "}
                          <span className="text-teal-600 dark:text-cyan-400 font-semibold">
                            browse
                          </span>
                        </p>
                        <p className="text-xs text-slate-400">
                          Images, PDF, DOC — Max 10 MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Document Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                      Document Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. My Passport, Flight Ticket"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      id="upload-doc-name"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:outline-hidden focus:border-teal-500 text-sm transition"
                    />
                  </div>

                  {/* Category + Tags row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                        Category
                      </label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        id="upload-doc-category"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:outline-hidden focus:border-teal-500 text-sm transition font-medium"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. trip2026, paris"
                        value={uploadTags}
                        onChange={(e) => setUploadTags(e.target.value)}
                        id="upload-doc-tags"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:outline-hidden focus:border-teal-500 text-sm transition"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      placeholder="Any additional details about this document..."
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                      rows={3}
                      id="upload-doc-notes"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:outline-hidden focus:border-teal-500 text-sm transition resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isUploading || !uploadFile}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 rounded-xl transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Upload Document
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════ */}
      {/* PREVIEW MODAL */}
      {/* ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {previewDoc && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setPreviewDoc(null)}
            />
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-4 sm:inset-8 md:inset-16 z-50 bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Preview header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`${getCategoryConfig(previewDoc.category).lightBg} ${getCategoryConfig(previewDoc.category).text} p-2 rounded-lg`}>
                    {React.createElement(getCategoryConfig(previewDoc.category).icon, { className: "w-5 h-5" })}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate">{previewDoc.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{previewDoc.category}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span>{formatFileSize(previewDoc.fileSize)}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span>{new Date(previewDoc.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-teal-600 dark:text-cyan-400 cursor-pointer"
                    title="Open in new tab"
                  >
                    <Eye className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => handleDelete(previewDoc._id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition text-red-500 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Preview content */}
              <div className="flex-1 overflow-auto bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4">
                {isImageType(previewDoc.fileType) ? (
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                ) : previewDoc.fileType === "application/pdf" ? (
                  <iframe
                    src={previewDoc.fileUrl}
                    title={previewDoc.name}
                    className="w-full h-full rounded-lg border border-slate-200 dark:border-slate-800"
                  />
                ) : (
                  <div className="text-center">
                    <FileText className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                      Preview not available for this file type.
                    </p>
                    <a
                      href={previewDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-teal-600 dark:text-cyan-400 font-semibold hover:underline"
                    >
                      <Eye className="w-4 h-4" /> Open file in browser
                    </a>
                  </div>
                )}
              </div>

              {/* Preview footer — notes + tags */}
              {(previewDoc.notes || (previewDoc.tags && previewDoc.tags.length > 0)) && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                  {previewDoc.notes && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Notes: </span>
                      {previewDoc.notes}
                    </p>
                  )}
                  {previewDoc.tags && previewDoc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                      {previewDoc.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
