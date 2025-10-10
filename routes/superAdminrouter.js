// routes/superAdminRouter.js
const express = require("express");
const { adminIdentifier } = require("../middleware/adminIdentifier.js");
const { getAdminStats, getRecentOrders } = require("../controllers/adminStats");
const {
  getUser, updateUser, deleteUser, getAllUsers,
} = require("../controllers/users");
const {
  createProduct, updateProduct, deleteProduct,
} = require("../controllers/products");
const {
  createImage, updateImage, deleteImage,
} = require("../controllers/productImages");
const {
  getAllOrders, updateCustomerOrder, deleteCustomerOrder,
} = require("../controllers/customer_orders");
const { getMessages } = require("../controllers/message.js");
const { getAllWishlist } = require("../controllers/wishlist");

const router = express.Router();

// ✅ Protect all admin routes
router.use(adminIdentifier);

// 📊 Admin Dashboard Stats
router.get("/stats", getAdminStats);
router.get("/recent-orders", getRecentOrders);

// 👥 Users
router.get("/users", getAllUsers);
router.route("/users/:id").get(getUser).put(updateUser).delete(deleteUser);

// 📦 Products
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// 🖼️ Product Images
router.post("/product-images", createImage);
router.put("/product-images/:id", updateImage);
router.delete("/product-images/:id", deleteImage);

// 🛒 Orders
router.get("/orders", getAllOrders);
router.route("/orders/:id").put(updateCustomerOrder).delete(deleteCustomerOrder);

// 💬 Messages
router.get("/messages", getMessages);

// 💖 Wishlist
router.get("/wishlist", getAllWishlist);

module.exports = router;
