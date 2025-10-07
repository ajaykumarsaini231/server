const express = require('express');
const router = express.Router();

const { identifier } = require("../middleware/indentifier.js");  // 👤 Normal user check
const { adminIdentifier } = require("../middleware/adminIdentifier.js"); // 🛡️ Admin-only check

const {
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers, 
  getUserByEmail,
  getCurrentUser,
} = require('../controllers/users');

/**
 * 🟢 Public Routes
 * - Signup and basic fetch by email (no login required)
 */
router.post("/", createUser);
router.get("/email/:email", getUserByEmail);

/**
 * 🧩 Authenticated User Routes
 * - Requires a valid token
 */
router.get("/profile", identifier, getCurrentUser);

/**
 * 🧩 Admin-only Routes
 * - Requires admin token (role: "admin")
 */
router.get("/", adminIdentifier, getAllUsers);
router.get("/:id", adminIdentifier, getUser);
router.put("/:id", adminIdentifier, updateUser);
router.delete("/:id", adminIdentifier, deleteUser);

module.exports = router;
