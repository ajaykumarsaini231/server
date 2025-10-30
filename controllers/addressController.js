import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getAddressesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ addresses });
  } catch (error) {
    console.error("❌ Error fetching addresses:", error);
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};

export const createAddress = async (req, res) => {
  try {
    const {
      userId,
      name = "",
      lastname = "",
      company = "",
      phone = "",
      address = "",
      apartment = "",
      city = "",
      postalCode = "",
      country = "",
      orderNotice = "",
      isDefault = false,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // 🟢 Unset other defaults if this one is default
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        name,
        lastname,
        company,
        phone,
        address,
        apartment,
        city,
        postalCode,
        country,
        orderNotice,
        isDefault,
      },
    });

    res.status(201).json(newAddress);
  } catch (error) {
    console.error("❌ Error creating address:", error);
    res.status(500).json({ message: "Failed to create address" });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isDefault, ...data } = req.body;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (isDefault && userId) {
      await prisma.address.updateMany({
        where: { userId, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: { ...data, isDefault },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Error updating address:", error);
    res.status(500).json({ message: "Failed to update address" });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.address.delete({ where: { id } });
    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting address:", error);
    res.status(500).json({ message: "Failed to delete address" });
  }
};
