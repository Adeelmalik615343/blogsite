const postBox = document.getElementById("post");
const pageTitle = document.getElementById("pageTitle");
const metaDesc = document.getElementById("metaDesc");

// 🔑 Get slug from URL path: /post/slug
const pathParts = window.location.pathname.split("/post/");
const slug = pathParts[1];

const BASE_URL = "https://blogsite-3-zaob.onrender.com"; // Backend API URL

if (!slug) {
  postBox.innerHTML = "<p>Post not found</p>";
} else {
  fetch(`${BASE_URL}/api/blogs/slug/${slug}`)
    .then(res => {
      if (!res.ok) throw new Error("Post not found");
      return res.json();
    })
    .then(blog => {
      if (!blog || !blog.title || !blog.content) {
        postBox.innerHTML = "<p>Post not found</p>";
        return;
      }

      // 🔑 Handle image
      const imageHtml = blog.image
        ? `<img src="${blog.image.startsWith("http") ? blog.image : BASE_URL + blog.image}" alt="${blog.title}" class="img-fluid mb-3">`
        : "";

      // Insert blog content
      postBox.innerHTML = `
        <h1>${blog.title}</h1>
        ${imageHtml}
        <div class="post-content">${blog.content}</div>
      `;

      // Language direction
      const isUrdu = blog.language === "urdu";
      postBox.setAttribute("dir", isUrdu ? "rtl" : "ltr");
      postBox.setAttribute("lang", isUrdu ? "ur" : "en");
      postBox.classList.add(isUrdu ? "urdu" : "english");

      // H1 lang
      postBox.querySelector("h1").setAttribute("lang", isUrdu ? "ur" : "en");

      // HTML lang for SEO
      document.documentElement.lang = isUrdu ? "ur" : "en";
      document.documentElement.dir = isUrdu ? "rtl" : "ltr";

      // SEO meta tags
      pageTitle.innerText = blog.seoTitle || blog.title;
      metaDesc.setAttribute(
        "content",
        blog.seoDescription || blog.content.replace(/<[^>]+>/g, "").substring(0, 160)
      );
    })
    .catch(err => {
      console.error(err);
      postBox.innerHTML = "<p>Error loading post</p>";
    });
}
