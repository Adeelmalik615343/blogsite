const postBox = document.getElementById("post");
const pageTitle = document.getElementById("pageTitle");
const metaDesc = document.getElementById("metaDesc");

// 🔑 Get slug from query string ?slug=...
const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get("slug");
const BASE_URL = "http://localhost:5000"; // backend URL

if (!slug) {
  postBox.innerHTML = "<p>Post not found</p>";
} else {
  fetch(`${BASE_URL}/api/blogs/slug/${slug}`)
    .then(res => res.json())
    .then(blog => {
      if (!blog || !blog.title || !blog.content) {
        postBox.innerHTML = "<p>Post not found</p>";
        return;
      }

      // 🔑 Local image
      const imageHtml = blog.image
        ? `<img src="${BASE_URL}/${blog.image}" alt="${blog.title}" class="img-fluid mb-3">`
        : "";

      // Insert content
      postBox.innerHTML = `
        <h1>${blog.title}</h1>
        ${imageHtml}
        <div class="post-content">${blog.content}</div>
      `;

      // Language from DB
      const isUrdu = blog.language === "urdu";

      // Direction + lang
      postBox.setAttribute("dir", isUrdu ? "rtl" : "ltr");
      postBox.setAttribute("lang", isUrdu ? "ur" : "en");
      postBox.classList.add(isUrdu ? "urdu" : "english");

      // h1 lang
      postBox.querySelector("h1")
        .setAttribute("lang", isUrdu ? "ur" : "en");

      // HTML lang (SEO)
      document.documentElement.lang = isUrdu ? "ur" : "en";
      document.documentElement.dir  = isUrdu ? "rtl" : "ltr";

      // SEO tags
      pageTitle.innerText = blog.seoTitle || blog.title;
      metaDesc.setAttribute(
        "content",
        blog.seoDescription ||
        blog.content.replace(/<[^>]+>/g, "").substring(0, 160)
      );
    })
    .catch(err => {
      console.error(err);
      postBox.innerHTML = "<p>Error loading post</p>";
    });
}
