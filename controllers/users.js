const prisma = require("../utills/db");
const bcrypt = require("bcryptjs");
const { asyncHandler, AppError } = require("../utills/errorHandler");
const jwt = require("jsonwebtoken");

function excludePassword(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

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
 * Update User (Admin or self)
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

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) throw new AppError("User ID is required", 400);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", 404);

  await prisma.user.delete({ where: { id } });

  res.status(204).send();
});

const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) throw new AppError("User ID is required", 400);

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,      
      email: true,     
      role: true,
      verified: true,
      photoUrl: true,
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

  res.status(200).json(user); // password is not selected, so no need to exclude
});


/**
 *  Get User by Email (Public)
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
 *  Get Current Logged-in User
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.userId; 
  if (!userId) throw new AppError("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      verified: true,
      photoUrl: true,
    },
  });

  if (!user) throw new AppError("User not found", 404);

  res.status(200).json({
    success: true,
    user, 
  });
});


const updateCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?.userId;
  const { name, currentPassword, newPassword, photoUrl } = req.body;

  if (!userId) throw new AppError("Unauthorized", 401);

  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) throw new AppError("User not found", 404);

  const updateData = {};
  if (name) updateData.name = name;
  if (photoUrl) updateData.photoUrl = photoUrl;

  if (newPassword) {
    if (!currentPassword) throw new AppError("Current password required", 400);

    const isMatch = await bcrypt.compare(currentPassword, existingUser.password);
    if (!isMatch) throw new AppError("Current password is incorrect", 401);

    if (newPassword.length < 8)
      throw new AppError("Password must be at least 8 characters long", 400);

    updateData.password = await bcrypt.hash(newPassword, 14);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      photoUrl: updatedUser.photoUrl,
      role: updatedUser.role,
      verified: updatedUser.verified,
    },
  });
});



const deleteCurrentUser = async (req, res) => {
  try {
    //  Extract token from header or cookie
    const authHeader = req.headers.authorization || req.cookies.Authorization;

    if (!authHeader)
      return res.status(401).json({ success: false, message: "No token provided" });

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    //  Verify token
    const decoded = jwt.verify(token, process.env.Secret_Token);

    if (!decoded || !decoded.userId)
      return res.status(401).json({ success: false, message: "Invalid token" });

    //  Delete the logged-in user
    await prisma.user.delete({
      where: { id: decoded.userId },
    });

    // Optionally, clear any sessions or cookies
    res.clearCookie("Authorization");

    return res.status(204).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting current user:", error);

    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



module.exports = {
  getCurrentUser,
  updateCurrentUser,
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  getUserByEmail,
  deleteCurrentUser,
};
