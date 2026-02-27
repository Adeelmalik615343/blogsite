require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const Blog = require("./models/Blog");
const blogRoutes = require("./routes/blogRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// -----------------------
// Mongoose Settings
// -----------------------
mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", false);

// -----------------------
// Middleware
// -----------------------
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------
// ✅ Serve Static Frontend
// robots.txt & sitemap.xml are here
// -----------------------
app.use(express.static(path.join(__dirname, "frontend")));

// -----------------------
// API Routes
// -----------------------
app.use("/api/blogs", blogRoutes);
app.use("/admin/api", adminRoutes);

// -----------------------
// Landing Page
// -----------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// -----------------------
// Admin Page
// -----------------------
app.get("/admin", (req, res) => {
  const key = req.query.key;
  if (!key) return res.status(403).send("Admin key missing");
  res.sendFile(path.join(__dirname, "frontend", "admin", "admin.html"));
});

// -----------------------
// Helper: Escape HTML
// -----------------------
const escapeHtml = (str = "") =>
  str.replace(/[<>&'"]/g, c => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  }[c]));

// -----------------------
// SEO Blog Page
// -----------------------
app.get("/post/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) return res.status(404).send("Post not found");

    const latestPosts = await Blog.find({ slug: { $ne: blog.slug } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title slug");

    const isUrdu = blog.language === "urdu";
    const baseUrl = "https://blogsite-3-zaob.onrender.com";

    res.send(`<!DOCTYPE html>
<html lang="${isUrdu ? "ur" : "en"}" dir="${isUrdu ? "rtl" : "ltr"}">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(blog.seoTitle || blog.title)}</title>
  <meta name="description" content="${escapeHtml(blog.seoDescription || "")}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="canonical" href="${baseUrl}/post/${blog.slug}">
  <link href="https://fonts.googleapis.com/css2?family=Roboto&family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">

  <style>
    body {
      margin: 0;
      font-family: ${isUrdu ? "'Noto Nastaliq Urdu'" : "'Roboto'"}, sans-serif;
      background: #f4f6f8;
      line-height: 1.9;
    }
    .layout {
      max-width: 1200px;
      margin: 30px auto;
      display: flex;
      gap: 20px;
      padding: 0 12px;
    }
    .post-container {
      flex: 3;
      background: #fff;
      padding: 24px;
      border-radius: 10px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    .sidebar {
      flex: 1;
      background: #fff;
      padding: 18px;
      border-radius: 10px;
      height: fit-content;
    }
    @media (max-width: 900px) {
      .layout { flex-direction: column; }
    }
  </style>
</head>

<body>
  <div class="layout">

    <article class="post-container">
      <h1>${escapeHtml(blog.title)}</h1>
      ${blog.image ? `<img src="${blog.image}" alt="${escapeHtml(blog.title)}">` : ""}
      <div>${blog.content}</div>
    </article>

    <aside class="sidebar">
      <h3>Latest Posts</h3>
      <ul>
        ${
          latestPosts.length
            ? latestPosts.map(
                p => `<li><a href="/post/${p.slug}">${escapeHtml(p.title)}</a></li>`
              ).join("")
            : "<li>No posts yet</li>"
        }
      </ul>
    </aside>

  </div>
</body>
</html>`);
  } catch (err) {
    console.error("❌ Blog error:", err);
    res.status(500).send("Server error");
  }
});

// -----------------------
// Frontend Blogs API
// -----------------------
app.get("/api/frontend/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .select("title slug image seoDescription language createdAt");
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: "Failed to load blogs" });
  }
});

// -----------------------
// Start Server
// -----------------------
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

startServer();
