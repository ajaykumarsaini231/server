// controllers/adminStats.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAdminStats = async (req, res) => {
  try {
    // Count total records from relevant tables
    const [users, products, categories, orders] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.category.count(),
      prisma.customer_order.count(),
    ]);

    res.json({
      success: true,
      data: {
        users,
        products,
        categories,
        orders,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching admin stats:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getRecentOrders = async (req, res) => {
  try {
    const { sort = "desc", days = 2 } = req.query;

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - Number(days));

    const orders = await prisma.customer_order.findMany({
      where: {
        dateTime: {
          gte: sinceDate,
        },
      },
      orderBy: {
        dateTime: sort === "asc" ? "asc" : "desc",
      },
      take: 10, // limit results for dashboard
      include: {
        user: {
          select: { name: true, email: true },
        },
        products: {
          include: {
            product: { select: { title: true, price: true, mainImage: true } },
          },
        },
      },
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("❌ Error fetching recent orders:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch recent orders" });
  }
};