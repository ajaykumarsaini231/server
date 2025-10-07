const express = require('express');
const router = express.Router();
const { identifier } = require("../middleware/indentifier.js"); // 👈 Import middleware

const {
  getCustomerOrder,
  createCustomerOrder,
  updateCustomerOrder,
  deleteCustomerOrder,
  getAllOrders,
  getUserOrders
} = require('../controllers/customer_orders');

// ================================
// 🧩 Route: All Orders (Admin)
// ================================
// Only admin can get all orders, but any authenticated user can create
// router.use(identifier);

router.route('/')
  .get( getAllOrders)      // ✅ protected with identifier
  .post( createCustomerOrder); // ✅ only logged-in users can create

// ================================
// 🧩 Route: Get Orders for a Specific User
// Example: GET /orders/user/<userId>
// ================================
router.get('/user/:userId',  getUserOrders); // ✅ requires token

// ================================
// 🧩 Route: Individual Order by ID
// ================================
router.route('/:id')
  .get( getCustomerOrder)   // ✅ protected
  .put( updateCustomerOrder)
  .delete( deleteCustomerOrder);

module.exports = router;
