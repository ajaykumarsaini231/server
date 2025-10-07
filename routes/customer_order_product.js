const express = require("express");
const {
  createOrderProduct,
  updateProductOrder,
  deleteProductOrder,
  getProductOrder,
  getAllProductOrders,
} = require("../controllers/customer_order_product");
const { identifier } = require("../middleware/indentifier.js"); // 👈 Import middleware

const router = express.Router();

/**
 * 🟢 Public Routes
 */
router.get("/", getAllProductOrders);
router.get("/:id", getProductOrder);

/**
 * 🔒 Protected Routes — require JWT
 */

// router.post("/", createOrderProduct);
// router.put("/:id",  updateProductOrder);
// router.delete("/:id", deleteProductOrder);


router.post("/", identifier, createOrderProduct);
router.put("/:id", identifier, updateProductOrder);
router.delete("/:id", identifier, deleteProductOrder);

module.exports = router;
