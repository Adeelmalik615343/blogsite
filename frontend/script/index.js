
const API = "https://blogsite-3-zaob.onrender.com/api/blogs"; // Render backend API
let allBlogs = [];

// ------------------------
// LOAD BLOGS FROM BACKEND
// ------------------------
async function loadBlogs() {
  try {
    const res = await fetch(API);
    const data = await res.json();
    allBlogs = data.blogs || [];
    displayBlogs(allBlogs);
  } catch (err) {
    console.error("Error loading blogs:", err);
    document.getElementById("blogsContainer").innerHTML =
      '<p class="text-danger text-center">Failed to load blogs. Check backend!</p>';
  }
}

// ------------------------
// DISPLAY BLOGS
// ------------------------
function displayBlogs(blogs) {
  const container = document.getElementById("blogsContainer");

  if (!blogs.length) {
    container.innerHTML = '<p class="text-muted text-center">No blogs found.</p>';
    return;
  }

  container.innerHTML = blogs.map(b => {
    const langClass = b.language === "urdu" ? "urdu" : "english";

    // IMAGE HANDLING
    let imageUrl = "https://via.placeholder.com/400x250?text=No+Image"; // fallback
    if (b.image) {
      if (b.image.startsWith("http")) {
        // Cloudinary or full URL
        imageUrl = b.image;
      } else {
        // Local upload: prepend Render backend URL
        imageUrl = `${API.replace('/api/blogs','')}${b.image}`;
      }
    }

    // EXCERPT HANDLING
    const excerpt = b.seoDescription ||
      (b.content ? b.content.replace(/<[^>]+>/g, "").substring(0, 120) + "..." : "");

    return `<div class="col-12 col-md-6 col-lg-4 mb-4">
      <div class="card h-100 ${langClass}">
        <img src="${imageUrl}" class="card-img-top" alt="${b.title}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${b.title}</h5>
          <p class="card-text">${excerpt}</p>
          <a href="/post/${b.slug}" class="btn btn-primary mt-auto">Read More →</a>
        </div>
      </div>
    </div>`;
  }).join("");
}

// ------------------------
// SEARCH FUNCTIONALITY
// ------------------------
document.getElementById("searchInput").addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  const filtered = allBlogs.filter(b =>
    (b.title && b.title.toLowerCase().includes(q)) ||
    (b.content && b.content.toLowerCase().includes(q))
  );
  displayBlogs(filtered);
});

// ------------------------
// AUTO-COLLAPSE MOBILE NAV
// ------------------------
document.querySelectorAll('.navbar-collapse .nav-link').forEach(link => {
  link.addEventListener('click', () => {
    const collapse = document.querySelector('.navbar-collapse');
    if (collapse.classList.contains('show')) {
      bootstrap.Collapse.getOrCreateInstance(collapse).hide();
    }
  });
});

// ------------------------
// INITIAL LOAD
// ------------------------
loadBlogs();
document.querySelectorAll('.navbar-nav a[href^="#"]').forEach(link => {
  link.addEventListener('click', () => {
    const menu = document.getElementById('menu');
    const bsCollapse = bootstrap.Collapse.getInstance(menu);

    if (bsCollapse) {
      bsCollapse.hide();
    }
  });
});

