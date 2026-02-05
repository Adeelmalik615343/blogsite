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
  origin: "*", // you can restrict later
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------
// API Routes ONLY
// -----------------------
app.use("/api/blogs", blogRoutes);
app.use("/admin", adminRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, "frontend")));

// -----------------------
// Frontend: fetch all blogs
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
// Serve index.html for all frontend routes (no wildcard)
// -----------------------
app.use((req, res, next) => {
  // Only serve index.html for non-API, non-admin, non-post routes
  if (req.path.startsWith("/api") || req.path.startsWith("/admin") || req.path.startsWith("/post")) {
    return next();
  }

  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// -----------------------
// Health Check (Render)
app.get("/health", (req, res) => {
  res.send("✅ Blog API is running");
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
