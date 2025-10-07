const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// 📩 Subscribe
router.post("/", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const subscriber = await prisma.newsletter.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    res.status(201).json({
      success: true,
      message: "Subscribed successfully!",
      data: subscriber,
    });
  } catch (error) {
    console.error("Error subscribing:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📋 Get all subscribers
router.get("/", async (req, res) => {
    // res.send({message:"hello friends "})
  try {
    const subscribers = await prisma.newsletter.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(subscribers);
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;  // ✅ CommonJS export
