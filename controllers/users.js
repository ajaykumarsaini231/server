const prisma = require("../utills/db");
const bcrypt = require("bcryptjs");
const { asyncHandler, AppError } = require("../utills/errorHandler");

/** 🧩 Helper: Exclude password field */
function excludePassword(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

/**
 * ✅ Get All Users (Admin Only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      Wishlist: {
        include: { product: true },
      },
      Cart: {
        include: { product: true },
      },
      addresses: true,
      orders: {
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  const usersWithoutPasswords = users.map(u => excludePassword(u));
  res.status(200).json(usersWithoutPasswords);
});

/**
 * ✅ Create User (Public)
 */
const createUser = asyncHandler(async (req, res) => {
  const { email, password, name, role, photoUrl } = req.body;

  if (!email || !password)
    throw new AppError("Email and password are required", 400);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    throw new AppError("Invalid email format", 400);

  if (password.length < 8)
    throw new AppError("Password must be at least 8 characters long", 400);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser)
    throw new AppError("Email already exists", 400);

  const hashedPassword = await bcrypt.hash(password, 14);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      photoUrl,
    },
  });

  res.status(201).json(excludePassword(user));
});

/**
 * ✅ Update User (Admin or self)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, photoUrl, verified } = req.body;

  if (!id) throw new AppError("User ID is required", 400);

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) throw new AppError("User not found", 404);

  const updateData = {};

  if (name) updateData.name = name;
  if (photoUrl) updateData.photoUrl = photoUrl;
  if (typeof verified === "boolean") updateData.verified = verified;

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      throw new AppError("Invalid email format", 400);
    updateData.email = email;
  }

  if (password) {
    if (password.length < 8)
      throw new AppError("Password must be at least 8 characters long", 400);
    updateData.password = await bcrypt.hash(password, 14);
  }

  if (role) updateData.role = role;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    include: {
      Wishlist: {
        include: { product: true },
      },
      Cart: {
        include: { product: true },
      },
      addresses: true,
      orders: {
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  res.status(200).json(excludePassword(updatedUser));
});

/**
 * ✅ Delete User (Admin)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) throw new AppError("User ID is required", 400);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", 404);

  await prisma.user.delete({ where: { id } });

  res.status(204).send();
});

/**
 * ✅ Get User By ID (Admin)
 * Returns full profile with relations
 */
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) throw new AppError("User ID is required", 400);

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      Wishlist: {
        include: { product: true },
      },
      Cart: {
        include: { product: true },
      },
      addresses: true,
      orders: {
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!user) throw new AppError("User not found", 404);

  res.status(200).json(excludePassword(user));
});

/**
 * ✅ Get User by Email (Public)
 */
const getUserByEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (!email) throw new AppError("Email is required", 400);

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      Wishlist: {
        include: { product: true },
      },
      Cart: {
        include: { product: true },
      },
      addresses: true,
      orders: {
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!user) throw new AppError("User not found", 404);

  res.status(200).json(excludePassword(user));
});

/**
 * ✅ Get Current Logged-in User
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Wishlist: {
        include: { product: true },
      },
      Cart: {
        include: { product: true },
      },
      addresses: true,
      orders: {
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!user) throw new AppError("User not found", 404);

  res.status(200).json({
    success: true,
    user: excludePassword(user),
  });
});

const updateCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?.id; // set by identifier middleware
  if (!userId) throw new AppError("Unauthorized", 401);

  const { name, currentPassword, newPassword, photoUrl } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  const updateData = {};
  if (name) updateData.name = name;
  if (photoUrl) updateData.photoUrl = photoUrl;

  // Handle password change
  if (newPassword) {
    if (!currentPassword)
      throw new AppError("Current password is required", 400);

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new AppError("Current password is incorrect", 400);

    updateData.password = await bcrypt.hash(newPassword, 14);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: {
      Wishlist: { include: { product: true } },
      Cart: { include: { product: true } },
      addresses: true,
      orders: { include: { products: { include: { product: true } } } },
    },
  });

  const { password, ...userData } = updatedUser;
  res.status(200).json({ success: true, user: userData });
});



module.exports = {
  getCurrentUser,
  updateCurrentUser,
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  getUserByEmail,
  getCurrentUser,
};
