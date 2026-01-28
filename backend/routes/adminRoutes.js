const express = require("express");
const path = require("path");
const Blog = require("../models/Blog");
const slugify = require("slugify");

const router = express.Router();

// -----------------------
// Serve Admin HTML
// -----------------------
router.get("/", (req, res) => {
  const adminKey = req.query.key;
  if (adminKey !== "12345") return res.status(403).send("Access Denied");

  res.sendFile(path.join(__dirname, "../../frontend/admin/admin.html"));
});

// -----------------------
// CREATE BLOG ✅ FIXED ROUTE
// POST /api/blogs?key=12345
// -----------------------
router.post("/", async (req, res) => {
  try {
    const adminKey = req.query.key;
    if (adminKey !== "12345") {
      return res.status(403).json({ message: "Access Denied" });
    }

    const { title, content, language, seoTitle, seoDescription, image } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required"
      });
    }

    const slug = slugify(title, { lower: true, strict: true });

    const blog = new Blog({
      title,
      slug,
      content,
      language: language || "english",
      image: image || "",
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || content.replace(/<[^>]+>/g, "").slice(0, 150)
    });

    await blog.save();

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blog
    });
  } catch (err) {
    console.error("CREATE BLOG ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// -----------------------
// GET BLOG BY ID
// -----------------------
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -----------------------
// GET BLOG BY SLUG (IMPORTANT)
// -----------------------
router.get("/slug/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -----------------------
// UPDATE BLOG
// -----------------------
router.put("/:id", async (req, res) => {
  try {
    const adminKey = req.query.key;
    if (adminKey !== "12345") return res.status(403).send("Access Denied");

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    Object.assign(blog, req.body);
    await blog.save();

    res.json({ success: true, message: "Blog updated", blog });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -----------------------
// DELETE BLOG
// -----------------------
router.delete("/:id", async (req, res) => {
  try {
    const adminKey = req.query.key;
    if (adminKey !== "12345") return res.status(403).send("Access Denied");

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
