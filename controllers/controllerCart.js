const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 🛒 Add to Cart
const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId are required" });
    }

    const existingCartItem = await prisma.cart.findFirst({
      where: { userId, productId },
    });

    let cartItem;
    if (existingCartItem) {
      cartItem = await prisma.cart.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + (quantity || 1) },
      });
    } else {
      cartItem = await prisma.cart.create({
        data: { userId, productId, quantity: quantity || 1 },
      });
    }

    return res.status(201).json(cartItem);
  } catch (error) {
    console.error("Add to Cart Error:", error);
    return res.status(500).json({ message: "Failed to add to cart", error: error.message });
  }
};

// 📦 Get User Cart
const getUserCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const cart = await prisma.cart.findMany({
      where: { userId },
      include: { product: true },
    });

    return res.status(200).json(cart);
  } catch (error) {
    console.error("Get Cart Error:", error);
    return res.status(500).json({ message: "Failed to fetch cart", error: error.message });
  }
};

// ✏️ Update Quantity
const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const updatedItem = await prisma.cart.update({
      where: { id },
      data: { quantity },
    });

    return res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Update Cart Error:", error);
    return res.status(500).json({ message: "Failed to update cart", error: error.message });
  }
};

// ❌ Remove item
const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.cart.delete({ where: { id } });

    return res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Remove Cart Error:", error);
    return res.status(500).json({ message: "Failed to remove item", error: error.message });
  }
};

// 🧹 Clear Cart
const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.cart.deleteMany({ where: { userId } });

    return res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    return res.status(500).json({ message: "Failed to clear cart", error: error.message });
  }
};

module.exports = {
  addToCart,
  getUserCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
