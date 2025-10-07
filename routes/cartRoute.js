const express = require("express");
const { addToCart, getUserCart, updateCartItem, removeCartItem, clearCart } = require("../controllers/controllerCart");

const router = express.Router();
const { identifier } = require("../middleware/indentifier.js"); // 👈 Import middleware

// const router = express.Router();

// 🧱 Protect all routes using JWT middleware
router.use(identifier);

router.post("/", addToCart);
router.get("/:userId", getUserCart);
router.put("/:id", updateCartItem);
router.delete("/:id", removeCartItem);
router.delete("/clear/:userId", clearCart);

module.exports = router;
