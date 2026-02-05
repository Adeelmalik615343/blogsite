require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

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
app.use("/admin-api", adminRoutes); // admin backend API

// -----------------------
// Serve Frontend Static Files
// -----------------------
app.use(express.static(path.join(__dirname, "frontend")));

// -----------------------
// Frontend Home Page
// -----------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// -----------------------
// Admin Panel
// -----------------------
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "admin", "index.html"));
});

// -----------------------
// SEO Blog Page by Slug
// -----------------------
app.get("/post/:slug", async (req, res) => {
  try {
    const Blog = require("./models/Blog");
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
</head>
<body>
  <h1>${blog.title}</h1>
  ${imageUrl ? `<img src="${imageUrl}" alt="${blog.title}" />` : ""}
  <div>${blog.content}</div>
</body>
</html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
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
