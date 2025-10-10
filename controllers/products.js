const prisma = require("../utills/db"); // ✅ Use shared connection with SSL
const { asyncHandler, handleServerError, AppError } = require("../utills/errorHandler");

// Security: Define whitelists for allowed filter types and operators
const ALLOWED_FILTER_TYPES = ['price', 'rating', 'category', 'inStock', 'outOfStock'];
const ALLOWED_OPERATORS = ['gte', 'lte', 'gt', 'lt', 'equals', 'contains'];
const ALLOWED_SORT_VALUES = ['defaultSort', 'titleAsc', 'titleDesc', 'lowPrice', 'highPrice'];

// Security: Input validation functions
function validateFilterType(filterType) {
  return ALLOWED_FILTER_TYPES.includes(filterType);
}

function validateOperator(operator) {
  return ALLOWED_OPERATORS.includes(operator);
}

function validateSortValue(sortValue) {
  return ALLOWED_SORT_VALUES.includes(sortValue);
}

function validateAndSanitizeFilterValue(filterType, filterValue) {
  switch (filterType) {
    case 'price':
    case 'rating':
    case 'inStock':
    case 'outOfStock':
      const numValue = parseInt(filterValue);
      return isNaN(numValue) ? null : numValue;
    case 'category':
      return typeof filterValue === 'string' && filterValue.trim().length > 0 
        ? filterValue.trim() 
        : null;
    default:
      return null;
  }
}

// Security: Safe filter object builder
function buildSafeFilterObject(filterArray) {
  const filterObj = {};
  
  for (const item of filterArray) {
    // Validate filter type
    if (!validateFilterType(item.filterType)) {
      console.warn(`Invalid filter type: ${item.filterType}`);
      continue;
    }
    
    // Validate operator
    if (!validateOperator(item.filterOperator)) {
      console.warn(`Invalid operator: ${item.filterOperator}`);
      continue;
    }
    
    // Validate and sanitize filter value
    const sanitizedValue = validateAndSanitizeFilterValue(item.filterType, item.filterValue);
    if (sanitizedValue === null) {
      console.warn(`Invalid filter value for ${item.filterType}: ${item.filterValue}`);
      continue;
    }
    
    // Build safe filter object
    filterObj[item.filterType] = {
      [item.filterOperator]: sanitizedValue,
    };
  }
  
  return filterObj;
}

const getAllProducts = asyncHandler(async (request, response) => {
  const mode = request.query.mode || "";
  
  // checking if we are on the admin products page because we don't want to have filtering, sorting and pagination there
  if(mode === "admin"){
    const adminProducts = await prisma.product.findMany({});
    return response.json(adminProducts);
  } else {
    const dividerLocation = request.url.indexOf("?");
    let filterObj = {};
    let sortObj = {};
    let sortByValue = "defaultSort";

    // getting current page with validation
    const page = Number(request.query.page);
    const validatedPage = (page && page > 0) ? page : 1;

    if (dividerLocation !== -1) {
      const queryArray = request.url
        .substring(dividerLocation + 1, request.url.length)
        .split("&");

      let filterType;
      let filterArray = [];

      for (let i = 0; i < queryArray.length; i++) {
        // Security: Use more robust parsing with validation
        const queryParam = queryArray[i];
        
        // Extract filter type safely
        if (queryParam.includes("filters")) {
          if (queryParam.includes("price")) {
            filterType = "price";
          } else if (queryParam.includes("rating")) {
            filterType = "rating";
          } else if (queryParam.includes("category")) {
            filterType = "category";
          } else if (queryParam.includes("inStock")) {
            filterType = "inStock";
          } else if (queryParam.includes("outOfStock")) {
            filterType = "outOfStock";
          } else {
            // Skip unknown filter types
            continue;
          }
        }

        if (queryParam.includes("sort")) {
          // Security: Validate sort value
          const extractedSortValue = queryParam.substring(queryParam.indexOf("=") + 1);
          if (validateSortValue(extractedSortValue)) {
            sortByValue = extractedSortValue;
          }
        }

        // Security: Extract filter parameters safely
        if (queryParam.includes("filters") && filterType) {
          let filterValue;
          
          // Extract filter value based on type
          if (filterType === "category") {
            filterValue = queryParam.substring(queryParam.indexOf("=") + 1);
          } else {
            const numValue = parseInt(queryParam.substring(queryParam.indexOf("=") + 1));
            filterValue = isNaN(numValue) ? null : numValue;
          }

          // Extract operator safely
          const operatorStart = queryParam.indexOf("$") + 1;
          const operatorEnd = queryParam.indexOf("=") - 1;
          
          if (operatorStart > 0 && operatorEnd > operatorStart) {
            const filterOperator = queryParam.substring(operatorStart, operatorEnd);
            
            // Only add to filter array if all values are valid
            if (filterValue !== null && filterOperator) {
              filterArray.push({ 
                filterType, 
                filterOperator, 
                filterValue 
              });
            }
          }
        }
      }
      
      // Security: Build filter object using safe function
      filterObj = buildSafeFilterObject(filterArray);
    }

    let whereClause = { ...filterObj };

    // Security: Handle category filter separately with validation
    if (filterObj.category && filterObj.category.equals) {
      delete whereClause.category;
    }

    // Security: Build sort object safely
    switch (sortByValue) {
      case "defaultSort":
        sortObj = {};
        break;
      case "titleAsc":
        sortObj = { title: "asc" };
        break;
      case "titleDesc":
        sortObj = { title: "desc" };
        break;
      case "lowPrice":
        sortObj = { price: "asc" };
        break;
      case "highPrice":
        sortObj = { price: "desc" };
        break;
      default:
        sortObj = {};
    }

    let products;

    if (Object.keys(filterObj).length === 0) {
      products = await prisma.product.findMany({
        skip: (validatedPage - 1) * 10,
        take: 12,
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy: sortObj,
      });
    } else {
      // Security: Handle category filter with proper validation
      if (filterObj.category && filterObj.category.equals) {
        products = await prisma.product.findMany({
          skip: (validatedPage - 1) * 10,
          take: 12,
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
          where: {
            ...whereClause,
            category: {
              name: {
                equals: filterObj.category.equals,
              },
            },
          },
          orderBy: sortObj,
        });
      } else {
        products = await prisma.product.findMany({
          skip: (validatedPage - 1) * 10,
          take: 12,
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
          where: whereClause,
          orderBy: sortObj,
        });
      }
    }

    return response.json(products);
  }
});

const getAllProductsOld = asyncHandler(async (request, response) => {
  const products = await prisma.product.findMany({
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
  });
  response.status(200).json(products);
});

// Create a new product
const createProduct = asyncHandler(async (request, response) => {
    console.log(request.body)
  const {
    slug,
    title,
    mainImage,
    price,
    description,
    manufacturer,
    categoryId,
    inStock,
    images, // Array of image URLs from frontend
  } = request.body;

     console.log(request.body.title)


  // Basic validation
  if (!title || !slug || !price || !categoryId) {
    throw new AppError(
      "Missing required fields: title, slug, price, and categoryId are required",
      400
    );
  }

  const product = await prisma.product.create({
    data: {
      slug,
      title,
      mainImage,
      price,
      rating: 5,
      description,
      manufacturer,
      categoryId,
      inStock,
      images: {
        create: images?.map((img) => ({ image: img.image })) || [], // create multiple images
      },
    },
    include: { images: true }, // return created images as well
  });

  return response.status(201).json(product);
});

// Update an existing product
const updateProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const {
    slug,
    title,
    mainImage,
    price,
    rating = 0,
    description,
    manufacturer,
    categoryId,
    inStock = 0,
    images = [],
  } = request.body;

  if (!id) throw new AppError("Product ID is required", 400);

  // Ensure the product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!existingProduct) throw new AppError("Product not found", 404);

  // Validate category exists (optional, prevents FK issues)
  if (categoryId) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) throw new AppError("Category not found", 404);
  }

  // Ensure images are in proper format
  const validImages = Array.isArray(images)
    ? images.filter(img => img?.image).map(img => ({ image: img.image }))
    : [];

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      title,
      mainImage,
      slug,
      price,
      rating,
      description,
      manufacturer,
      categoryId,
      inStock,
      images: {
        deleteMany: {}, // remove existing images
        create: validImages, // add new images
      },
    },
    include: { images: true },
  });

  return response.status(200).json(updatedProduct);
});


// Delete a product
const deleteProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  // Check for related records in order_product table
  const relatedOrderProductItems = await prisma.customer_order_product.findMany({
    where: { productId: id },
  });

  if (relatedOrderProductItems.length > 0) {
    throw new AppError(
      "Cannot delete product because of foreign key constraint",
      400
    );
  }

  // Delete product (images will be deleted automatically due to cascade)
  await prisma.product.delete({
    where: { id },
  });

  return response.status(204).send();
});


const searchProducts = asyncHandler(async (request, response) => {
  const { query } = request.query;
  
  if (!query) {
    throw new AppError("Query parameter is required", 400);
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        {
          title: {
            contains: query,
          },
        },
        {
          description: {
            contains: query,
          },
        },
      ],
    },
  });

  return response.json(products);
});

const getProductById = asyncHandler(async (request, response) => {
  const { id } = request.params;
  
  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  const product = await prisma.product.findUnique({
    where: {
      id: id,
    },
    include: {
      category: true,
    },
  });
  
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  
  return response.status(200).json(product);
});
const getProductsByCategoryId = asyncHandler(async (request, response) => {
  const { categoryId } = request.params;

  if (!categoryId) {
    throw new AppError("Category ID is required", 400);
  }

  const products = await prisma.product.findMany({
    where: {
      categoryId: categoryId, // match by foreign key
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (products.length === 0) {
    throw new AppError("No products found for this category", 404);
  }

  return response.status(200).json(products);
});
const getProductList = asyncHandler(async (req, res) => {
  try {
    const { inStockOnly } = req.query;

    const whereClause = inStockOnly === "true" ? { inStock: { gt: 0 } } : {};

    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        price: true,
        mainImage: true,
        inStock: true,
        category: {           // ✅ Include category info
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching product list:", err);
    res.status(500).json({ message: "Error fetching product list" });
  }
});


// Move multiple products to a category
const moveProductsToCategory = asyncHandler(async (req, res) => {
  const { productIds, categoryId } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new AppError("Product IDs are required", 400);
  }

  let targetCategory;
  let targetCategoryId = categoryId;

  if (categoryId === null || typeof categoryId === 'undefined') {
    // Find or create "General Collection" by name
    targetCategory = await prisma.category.findFirst({
      where: { name: "General Collection" }
    });

    if (!targetCategory) {
      targetCategory = await prisma.category.create({
        data: { name: "General Collection" }
      });
    }

    targetCategoryId = targetCategory.id;
  } else {
    // Move to specified category if categoryId provided
    targetCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    if (!targetCategory) {
      throw new AppError("Target category not found", 404);
    }
  }

  const existingProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true }
  });

  const existingIds = existingProducts.map(p => p.id);
  if (existingIds.length === 0) {
    throw new AppError("No valid products found", 404);
  }

  // Set categoryId to General Collection or specified category
  await prisma.product.updateMany({
    where: { id: { in: existingIds } },
    data: { categoryId: targetCategoryId }
  });

  return res.status(200).json({
    message: `${existingIds.length} product(s) moved to category "${targetCategory.name}"`,
  });
});



// Get products split by category membership
const getProductsSplitByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  if (!categoryId) throw new AppError("Category ID is required", 400);

  // Products in this category
  const inCategory = await prisma.product.findMany({
    where: { categoryId },
    include: { category: { select: { id: true, name: true } } },
  });

  // Products not in this category
  const notInCategory = await prisma.product.findMany({
  where: {
    categoryId: { not: categoryId },
  },
  include: {
    category: {
      select: { id: true, name: true },
    },
  },
});


  res.status(200).json({ inCategory, notInCategory });
});



module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductById,
  getProductsByCategoryId,
  getProductList,
  moveProductsToCategory,
  getProductsSplitByCategory,
};
