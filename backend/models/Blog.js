const mongoose = require("mongoose"); // MUST BE FIRST

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, required: true },
  content: { type: String, required: true },

  image: String, // Cloudinary URL

  language: {
    type: String,
    enum: ["urdu", "english"],
    default: "english"
  },

  seoTitle: String,
  seoDescription: String,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Blog", blogSchema);
