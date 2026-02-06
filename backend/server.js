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
// API Routes
// -----------------------
app.use("/api/blogs", blogRoutes);
app.use("/admin/api", adminRoutes); // separate admin API

// -----------------------
// Serve static frontend files
// -----------------------
app.use(express.static(path.join(__dirname, "frontend")));

// -----------------------
// Landing Page
// -----------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// -----------------------
// Admin Page with query parameter support
// -----------------------
app.get("/admin", (req, res) => {
  const key = req.query.key;
  if (!key) return res.status(403).send("Admin key missing");
  res.sendFile(path.join(__dirname, "frontend", "admin", "admin.html"));
});

// -----------------------
// SEO Blog Page by slug
// -----------------------
app.get("/post/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) return res.status(404).send("Post not found");

    const isUrdu = blog.language === "urdu";
    const imageUrl = blog.image || "";

    res.send(`<!DOCTYPE html>
<html lang="${isUrdu ? "ur" : "en"}" dir="${isUrdu ? "rtl" : "ltr"}">
<head>
  <meta charset="UTF-8">
  <title>${blog.seoTitle || blog.title}</title>
  <meta name="description" content="${blog.seoDescription || ""}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Roboto&family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: ${isUrdu ? "'Noto Nastaliq Urdu', serif" : "'Roboto', sans-serif"};
      background: #f8f9fa;
      margin: 0;
      color: #333;
      line-height: 1.9;
    }
    .container {
      max-width: 800px;
      margin: 40px auto;
      padding: 15px;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 20px;
      text-align: ${isUrdu ? "right" : "left"};
    }
    .content {
      font-size: 18px;
      text-align: ${isUrdu ? "right" : "left"};
    }
    img {
      max-width: 100%;
      border-radius: 8px;
      margin: 20px 0;
      display: block;
    }
    a {
      text-decoration: none;
      color: #0d6efd;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${blog.title}</h1>
    ${imageUrl ? `<img src="${imageUrl}" alt="${blog.title}" />` : ""}
    <div class="content">${blog.content}</div>
    <a href="/">← Back to Home</a>
  </div>
</body>
</html>`);
  } catch (err) {
    console.error("❌ Blog page error:", err.message);
    res.status(500).send("Server error");
  }
});

// -----------------------
// Frontend API for blogs
// -----------------------
app.get("/api/frontend/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .select("title slug image seoDescription language createdAt");
    res.json(blogs);
  } catch (err) {
    console.error("❌ Frontend blogs error:", err.message);
    res.status(500).json({ message: "Failed to load blogs" });
  }
});

// -----------------------
// Dynamic Sitemap (SEO)
// -----------------------
app.get("/sitemap.xml", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .select("slug updatedAt")
      .sort({ updatedAt: -1 });

    res.set("Content-Type", "application/xml");

    // ⚠️ CHANGE THIS TO YOUR REAL LIVE DOMAIN
    const baseUrl = "https://blogsite-3-zaob.onrender.com";

    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Homepage
    xml += `
      <url>
        <loc>${baseUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
    `;

    // Blog posts
    blogs.forEach(blog => {
      xml += `
        <url>
          <loc>${baseUrl}/post/${blog.slug}</loc>
          <lastmod>${blog.updatedAt.toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `;
    });

    xml += `</urlset>`;

    res.send(xml);
  } catch (err) {
    console.error("❌ Sitemap error:", err.message);
    res.status(500).send("Sitemap generation failed");
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
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
}

startServer();
