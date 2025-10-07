const express = require("express");
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductById,
  getProductsByCategoryId,
} = require("../controllers/products");

// ✅ Middleware imports
const { identifier } = require("../middleware/indentifier.js"); 
const { adminIdentifier } = require("../middleware/adminIdentifier.js"); // 👈 Import admin check

const router = express.Router();

/**
 * 🟢 Public Routes — no authentication required
 */
router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/category/:categoryId", getProductsByCategoryId);
router.get("/:id", getProductById);

/**
 * 🔒 Protected Admin Routes — only admins can create, update, or delete
 */
router.post("/", adminIdentifier, createProduct);
router.put("/:id", adminIdentifier, updateProduct);
router.delete("/:id", adminIdentifier, deleteProduct);

module.exports = router;
