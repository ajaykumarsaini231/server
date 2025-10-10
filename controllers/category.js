const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { asyncHandler, AppError } = require("../utills/errorHandler");

const createCategory = asyncHandler(async (request, response) => {
  const { name } = request.body;
  console.log(name)
  if (!name || name.trim().length === 0) {
    throw new AppError("Category name is required", 400);
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
    },
  });
  return response.status(201).json(category);
});

const updateCategory = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { name } = request.body;

  if (!id) {
    throw new AppError("Category ID is required", 400);
  }

  if (!name || name.trim().length === 0) {
    throw new AppError("Category name is required", 400);
  }

  const existingCategory = await prisma.category.findUnique({
    where: {
      id: id,
    },
  });

  if (!existingCategory) {
    throw new AppError("Category not found", 404);
  }

  const updatedCategory = await prisma.category.update({
    where: {
      id: existingCategory.id,
    },
    data: {
      name: name.trim(),
    },
  });

  return response.status(200).json(updatedCategory);
});

const deleteCategory = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Category ID is required", 400);
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new AppError("Category not found", 404);
  }

  // Find or create the "General" category
  let generalCategory = await prisma.category.findFirst({
    where: { name: "General" },
  });

  if (!generalCategory) {
    generalCategory = await prisma.category.create({
      data: { name: "General" },
    });
  }

  // Move all products from this category to General
  await prisma.product.updateMany({
    where: { categoryId: id },
    data: { categoryId: generalCategory.id },
  });

  // Optional: clear category name instead of deleting
  await prisma.category.update({
    where: { id },
    data: { name: "Deleted Category" }, // or "" if you want blank
  });

  return response.status(200).json({ message: "Category removed and products moved to General" });
});


const getCategory = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Category ID is required", 400);
  }

  const category = await prisma.category.findUnique({
    where: {
      id: id,
    },
  });
  
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  
  return response.status(200).json(category);
});

const getAllCategories = asyncHandler(async (request, response) => {
  const categories = await prisma.category.findMany({});
  return response.json(categories);
});

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getAllCategories,
};
