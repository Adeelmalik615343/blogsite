require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

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
// Allow all search engines
// -----------------------
app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(`User-agent: *
Allow: /

Sitemap: https://full-project-5.onrender.com/sitemap.xml`);
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

  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Roboto&family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background: #f4f6f8;
      font-family: ${isUrdu ? "'Noto Nastaliq Urdu'" : "'Roboto'"}, sans-serif;
      line-height: 1.9;
      color: #222;
    }

    .post-container {
      max-width: 900px;
      margin: 30px auto;
      background: #ffffff;
      padding: 24px;
      border-radius: 10px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.08);
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 20px;
      text-align: center;
    }

    .post-image {
      margin: 20px 0;
      text-align: center;
    }

    .post-image img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }

    .post-content p {
      margin-bottom: 16px;
      font-size: 1.05rem;
    }

    /* Make embedded images responsive */
    .post-content img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 15px auto;
      border-radius: 6px;
    }

    @media (max-width: 600px) {
      .post-container {
        margin: 10px;
        padding: 16px;
      }

      h1 {
        font-size: 1.5rem;
      }
    }
  </style>
</head>

<body>

  <article class="post-container">
    <h1>${escapeXml(blog.title)}</h1>

    ${
      blog.image
        ? `<div class="post-image">
             <img src="${blog.image}" alt="${escapeXml(blog.title)}">
           </div>`
        : ""
    }

    <div class="post-content">
      ${blog.content}
    </div>
  </article>

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
// ✅ SITEMAP.XML
// Dynamic + Manual option
// -----------------------
app.get("/sitemap.xml", async (req, res) => {
  res.setHeader("Content-Type", "application/xml");
  const baseUrl = "https://full-project-5.onrender.com";

  try {
    // Check if manual sitemap exists
    const manualPath = path.join(__dirname, "frontend", "sitemap.xml");
    if (fs.existsSync(manualPath)) {
      const manualXml = fs.readFileSync(manualPath, "utf-8");
      return res.status(200).send(manualXml);
    }

    // Else generate dynamic sitemap
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
    // Fallback sitemap
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
