const express = require("express");
const { adminIdentifier } = require("../middleware/adminIdentifier.js");

// 👥 User Controllers
const {
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,
} = require("../controllers/users");

// 📦 Product Controllers
const {
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/products");

// 🖼️ Product Image Controllers
const {
  createImage,
  updateImage,
  deleteImage,
} = require("../controllers/productImages");

// 🛒 Order Controllers
const {
  getAllOrders,
  updateCustomerOrder,
  deleteCustomerOrder,
} = require("../controllers/customer_orders");

// 💬 Message Controllers
const { getMessages } = require("../controllers/message.js");

// 💖 Wishlist Controllers
const { getAllWishlist } = require("../controllers/wishlist");

const router = express.Router();

// 🧱 Protect all routes — only admins/superadmins allowed
router.use(adminIdentifier);

/**
 * ===========================================
 * 👥 USER MANAGEMENT
 * ===========================================
 */

// Get all users
router.get("/users", getAllUsers);

// Get single user / Update user / Delete user
router
  .route("/users/:id")
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

/**
 * ===========================================
 * 📦 PRODUCT MANAGEMENT
 * ===========================================
 */

// Create new product
router.post("/products", createProduct);

// Update product
router.put("/products/:id", updateProduct);

// Delete product
router.delete("/products/:id", deleteProduct);

/**
 * ===========================================
 * 🖼️ PRODUCT IMAGE MANAGEMENT
 * ===========================================
 */

// Create new image
router.post("/product-images", createImage);

// Update image
router.put("/product-images/:id", updateImage);

// Delete image
router.delete("/product-images/:id", deleteImage);

/**
 * ===========================================
 * 🛒 ORDER MANAGEMENT
 * ===========================================
 */

// Get all orders
router.get("/orders", getAllOrders);

// Update/Delete order
router
  .route("/orders/:id")
  .put(updateCustomerOrder)
  .delete(deleteCustomerOrder);

/**
 * ===========================================
 * 💬 MESSAGES MANAGEMENT
 * ===========================================
 */

// Get all customer messages
router.get("/messages", getMessages);

/**
 * ===========================================
 * 💖 WISHLIST MANAGEMENT
 * ===========================================
 */

// Get all wishlists (admin overview)
router.get("/wishlist", getAllWishlist);

module.exports = router;
