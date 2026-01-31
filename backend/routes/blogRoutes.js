const express = require("express");
const Blog = require("../models/Blog");
const slugify = require("slugify");
const upload = require("../middleware/upload"); // CLOUDINARY multer

const router = express.Router();

/* ================= CREATE BLOG ================= */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, content, seoTitle, seoDescription, language } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required"
      });
    }

    const slug = slugify(title, { lower: true, strict: true });
    const blogLanguage = ["english", "urdu"].includes(language) ? language : "english";

    // ✅ CLOUDINARY IMAGE URL
    const image = req.file ? req.file.path : "";

    const blog = await Blog.create({
      title,
      slug,
      content,
      image,
      language: blogLanguage,
      seoTitle: seoTitle || title,
      seoDescription:
        seoDescription ||
        content.replace(/<[^>]+>/g, "").substring(0, 150)
    });

    console.log("✅ Blog created:", blog.slug);
    res.status(201).json({ success: true, blog });

  } catch (err) {
    console.error("❌ Create blog error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ================= UPDATE BLOG ================= */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const { title, content, seoTitle, seoDescription, language } = req.body;

    if (title && title !== blog.title) {
      blog.title = title;
      blog.slug = slugify(title, { lower: true, strict: true });
    }

    if (content) blog.content = content;
    if (seoTitle) blog.seoTitle = seoTitle;
    if (seoDescription) blog.seoDescription = seoDescription;
    if (["english", "urdu"].includes(language)) blog.language = language;

    // ✅ UPDATE IMAGE FROM CLOUDINARY
    if (req.file) {
      blog.image = req.file.path;
    }

    await blog.save();

    console.log("✅ Blog updated:", blog.slug);
    res.json({ success: true, blog });

  } catch (err) {
    console.error("❌ Update blog error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ================= DELETE BLOG ================= */
router.delete("/:id", async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Blog deleted" });
  } catch (err) {
    console.error("❌ Delete blog error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ================= GET ALL BLOGS ================= */
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .select("title slug image seoDescription createdAt language");

    res.json({ blogs });
  } catch (err) {
    console.error("❌ Get blogs error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ================= GET BLOG BY SLUG ================= */
router.get("/slug/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= GET BLOG BY ID ================= */
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json({ blog });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= QUILL IMAGE UPLOAD ================= */
router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // ✅ CLOUDINARY URL FOR QUILL
  const imageUrl = req.file.path;
  console.log("🖼️ Quill image uploaded:", imageUrl);

  res.json({ url: imageUrl });
});

module.exports = router;
