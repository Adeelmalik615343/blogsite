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
// ✅ ROBOTS.TXT
// Must be first
// -----------------------
app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(`User-agent: *
Allow: /

Sitemap: https://blogsite-3-zaob.onrender.com/sitemap.xml`);
});

// -----------------------
// Serve Static Frontend
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
// Helper: Escape XML characters
// -----------------------
const escapeXml = (str = "") =>
  str.replace(/[<>&'"]/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[c]));

// -----------------------
// SEO Blog Page
// -----------------------
app.get("/post/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) return res.status(404).send("Post not found");

    const isUrdu = blog.language === "urdu";

    res.send(`<!DOCTYPE html>
<html lang="${isUrdu ? "ur" : "en"}" dir="${isUrdu ? "rtl" : "ltr"}">
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(blog.seoTitle || blog.title)}</title>
  <meta name="description" content="${escapeXml(blog.seoDescription || "")}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <h1>${escapeXml(blog.title)}</h1>
  ${blog.image ? `<img src="${blog.image}" alt="${escapeXml(blog.title)}" />` : ""}
  <div>${blog.content}</div>
</body>
</html>`);
  } catch (err) {
    console.error("❌ Blog error:", err);
    res.status(500).send("Server error");
  }
});

// -----------------------
// Frontend API
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
// ✅ DYNAMIC SITEMAP.XML
// Fully Google Safe
// -----------------------
app.get("/sitemap.xml", async (req, res) => {
  res.setHeader("Content-Type", "application/xml");
  const baseUrl = "https://blogsite-3-zaob.onrender.com";

  try {
    const blogs = await Blog.find().select("slug updatedAt");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Homepage
    xml += `
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Blog posts
    blogs.forEach(blog => {
      xml += `
  <url>
    <loc>${baseUrl}/post/${escapeXml(blog.slug)}</loc>
    <lastmod>${(blog.updatedAt || new Date()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    xml += `</urlset>`;
    res.status(200).send(xml);

  } catch (err) {
    console.error("❌ Sitemap error:", err);
    // Fallback sitemap with homepage only
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
  </url>
</urlset>`);
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
    console.error("❌ MongoDB failed:", err.message);
    process.exit(1);
  }
}

startServer();
