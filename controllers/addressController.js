import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export default prisma;

/**
 * 🧾 Get all addresses for a user
 */
export const getAddressesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(addresses);
  } catch (error) {
    console.error("❌ Error fetching addresses:", error);
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};

/**
 * ➕ Add a new address
 */
export const createAddress = async (req, res) => {
  try {
    const { userId, name, lastname, address, city, postalCode, country, phone, isDefault } = req.body;

    if (!userId || !address || !city || !postalCode || !country) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // if new address is default, unset others
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: { userId, name, lastname, address, city, postalCode, country, phone, isDefault: !!isDefault },
    });

    res.status(201).json(newAddress);
  } catch (error) {
    console.error("❌ Error creating address:", error);
    res.status(500).json({ message: "Failed to create address" });
  }
};

/**
 * ✏️ Update address
 */

export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isDefault, ...data } = req.body;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Address not found" });
    }

    // 🟢 If this address is being set as default
    if (isDefault) {
      // Unset default for all other addresses of the same user
      await prisma.address.updateMany({
        where: { userId, NOT: { id } },
        data: { isDefault: false },
      });
    }

    // Update the current address
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


/**
 * 🗑️ Delete address
 */
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
