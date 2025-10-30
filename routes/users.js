const express = require('express');
const router = express.Router();

const { identifier } = require("../middleware/indentifier.js");
const { adminIdentifier } = require("../middleware/adminIdentifier.js");

const {
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getUserByEmail,
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
} = require('../controllers/users');

//  Public Routes
router.post("/", createUser);
router.get("/email/:email", getUserByEmail);

// router.get("/me",  getCurrentUser);
// router.put("/me/:id",  updateCurrentUser);
// router.get("/me",  deleteCurrentUser);

//  Authenticated User Routes
router.get("/me", identifier, getCurrentUser);
router.put("/me", identifier, updateCurrentUser);
router.delete("/me", identifier, deleteCurrentUser);


// // router.get("/",  getAllUsers);
// router.get("/me/:id",  getUser);
// router.put("/me/:id",  updateUser);
// router.delete("/me/:id",  deleteUser);


//  Admin Routes
router.get("/", adminIdentifier, getAllUsers);
router.get("/:id", adminIdentifier, getUser);
router.put("/:id", adminIdentifier, updateUser);
router.delete("/:id", adminIdentifier, deleteUser);

module.exports = router;
