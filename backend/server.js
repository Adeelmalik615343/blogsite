require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const Blog = require("./models/Blog");
const blogRoutes = require("./routes/blogRoutes");
const adminRoutes = require("./routes/adminRoutes");
const upload = require("./middleware/upload");

const app = express();

// -----------------------
// Mongoose Settings
// -----------------------
mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", false);

// -----------------------
// Middleware
// -----------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------
// Serve uploaded images (must exist)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// -----------------------
// API Routes
// -----------------------
app.use("/api/blogs", blogRoutes);
app.use("/admin", adminRoutes);

// -----------------------
// Landing Page - return index.html
// -----------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// -----------------------
// API to fetch all blogs for frontend
// -----------------------
app.get("/api/frontend/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .select("title slug image seoDescription language createdAt");
    res.json(blogs);
  } catch (err) {
    console.error("❌ Frontend blogs error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// -----------------------
// SEO Blog Page by slug (fixed featured image)
// -----------------------
// -----------------------
// SEO Blog Page by slug (fixed featured image)
// -----------------------
app.get("/post/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) return res.status(404).send("Post not found");

    const isUrdu = blog.language === "urdu";

    // Correct featured image URL
    const imageUrl = blog.image ? `http://localhost:5000/${blog.image}` : "";

    res.send(`
<!DOCTYPE html>
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
    .container { max-width: 800px; margin: 40px auto; padding: 15px; }
    h1 { font-size: 2rem; margin-bottom: 20px; text-align: ${isUrdu ? "right" : "left"}; }
    .content { font-size: 18px; text-align: ${isUrdu ? "right" : "left"}; }
    img { max-width: 100%; border-radius: 8px; margin: 20px 0; display: block; }
    a { text-decoration: none; color: #0d6efd; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${blog.title}</h1>
    
    <div class="content">${blog.content}</div>
    <a href="/">← Back to Home</a>
  </div>
</body>
</html>
    `);
  } catch (err) {
    console.error("❌ Blog page error:", err.message);
    res.status(500).send("Server error");
  }
});


// -----------------------
// Test Upload (DEV ONLY)
// -----------------------
app.post("/api/test-upload", upload.single("image"), (req, res) => {
  res.json({
    message: "Upload successful",
    file: req.file,
  });
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
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
}

startServer();
