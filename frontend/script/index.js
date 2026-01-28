const API = "http://localhost:5000/api/blogs"; // backend API
const BASE_URL = "http://localhost:5000";      // for images

const allBlogsContainer = document.getElementById("blogsContainer");
const searchInput = document.getElementById("searchInput");

let allBlogs = [];

// ================= LOAD BLOGS =================
async function loadBlogs() {
  try {
    const res = await fetch(API);
    allBlogs = await res.json(); // backend returns array directly

    if (!allBlogs.length) {
      allBlogsContainer.innerHTML =
        `<p class="text-muted text-center">No blogs found.</p>`;
      return;
    }

    displayBlogs(allBlogs);
  } catch (err) {
    console.error("Error loading blogs:", err);
    allBlogsContainer.innerHTML =
      `<p class="text-danger text-center">Failed to load blogs. Check backend!</p>`;
  }
}

// ================= DISPLAY BLOGS =================
function displayBlogs(blogs) {
  allBlogsContainer.innerHTML = blogs.map(b => {
    const langClass = b.language === "urdu" ? "urdu" : "english";
    const imageUrl = b.image
      ? `${BASE_URL}${b.image}`
      : "https://via.placeholder.com/400x250?text=No+Image";

    const excerpt = b.seoDescription ||
      (b.content ? b.content.replace(/<[^>]+>/g, "").substring(0, 120) + "..." : "");

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card h-100 ${langClass}">
          <img src="${imageUrl}" class="card-img-top" alt="${b.title}">
          <div class="card-body d-flex flex-column">
            <h5>${b.title}</h5>
            <p>${excerpt}</p>
            <a href="/post.html?slug=${b.slug}" class="btn btn-primary mt-auto">Read More →</a>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// ================= SEARCH =================
if (searchInput) {
  searchInput.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    const filtered = allBlogs.filter(b =>
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.content && b.content.toLowerCase().includes(q))
    );
    displayBlogs(filtered);
  });
}

// ================= INIT =================
loadBlogs();
