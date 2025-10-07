const express = require("express");
const {
  getAddressesByUserId,
  createAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/addressController.js");
const { identifier } = require("../middleware/indentifier.js"); // 👈 Import middleware

const router = express.Router();

// 🧱 Protect all routes using JWT middleware
router.use(identifier);

// 🧾 Get all addresses for a specific user
router.get("/:userId", getAddressesByUserId);

// ➕ Create a new address
router.post("/", createAddress);

// ✏️ Update an existing address
router.put("/:id", updateAddress);

// 🗑️ Delete an address
router.delete("/:id", deleteAddress);

module.exports = router;
