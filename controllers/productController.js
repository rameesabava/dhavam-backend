// controllers/productController.js
const productService = require('../services/productService');
const fs = require('fs/promises');
const path = require('path');

// Helper: parse sizes sent from FormData (expects JSON string or array)
function parseSizes(sizes) {
  if (Array.isArray(sizes)) {
    return sizes;
  }
  if (typeof sizes === 'string') {
    try {
      const parsed = JSON.parse(sizes);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback: comma‑separated "size,price" pairs – split by commas and trim
      return sizes
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Add product (admin)
// ---------------------------------------------------------------------------
exports.addProductController = async (req, res) => {
  try {
    const { name, description, group, sizes } = req.body;
    const uploadimage = req.file ? req.file.filename : req.body.image;

    if (!name || !description || !uploadimage) {
      return res.status(400).json({
        message: 'Name, description, and product image are required.',
      });
    }

    const productDetails = await productService.createProduct({
      name: name.trim(),
      description: description.trim(),
      category: group ? group.toUpperCase() : 'WHOLE',
      imageUrl: uploadimage,
      sizes: parseSizes(sizes), // expects [{size, price}]
    });

    return res.status(201).json(productDetails);
  } catch (error) {
    console.error('Add product error:', error);
    return res.status(500).json({
      message: error.message || 'Unable to add product.',
    });
  }
};

// ---------------------------------------------------------------------------
// Get all products (public)
// ---------------------------------------------------------------------------
exports.getAllProductsController = async (req, res) => {
  try {
    const allProducts = await productService.listProducts();
    return res.status(200).json(allProducts);
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ message: 'Unable to fetch products.' });
  }
};

// ---------------------------------------------------------------------------
// View one product (public)
// ---------------------------------------------------------------------------
exports.viewProductController = async (req, res) => {
  try {
    const productDetails = await productService.getProductById(
      Number(req.params.id)
    );
    if (!productDetails) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    return res.status(200).json(productDetails);
  } catch (error) {
    console.error('View product error:', error);
    return res.status(500).json({ message: 'Unable to fetch product.' });
  }
};

// ---------------------------------------------------------------------------
// Update product (admin)
// ---------------------------------------------------------------------------
exports.updateProductController = async (req, res) => {
  try {
    const { id } = req.params;
    // Build a payload that matches the Prisma schema
    const payload = {};
    if (req.body.name !== undefined) payload.name = req.body.name.trim();
    if (req.body.description !== undefined)
      payload.description = req.body.description.trim();
    if (req.body.group !== undefined)
      payload.category = req.body.group ? req.body.group.toUpperCase() : undefined;
    if (req.file) payload.imageUrl = req.file.filename;
    if (req.body.sizes !== undefined) payload.sizes = parseSizes(req.body.sizes);

    const updatedProduct = await productService.updateProduct(
      Number(id),
      payload
    );
    return res.status(200).json({
      message: 'Product updated successfully.',
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    console.error("SQL message:", error.sqlMessage);
    console.error("SQL code:", error.code);
    console.error("SQL state:", error.sqlState);

    return res.status(500).json({
      message: error.sqlMessage || error.message || "Unable to update product.",
      code: error.code,
    });
  }
};

// ---------------------------------------------------------------------------
// Delete a product (admin)
// ---------------------------------------------------------------------------
exports.deleteProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await productService.getProductById(numericId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await productService.deleteProduct(numericId);

    // Remove uploaded image if present
    if (product.imageUrl) {
      const imageName = path.basename(product.imageUrl);
      const imagePath = path.join(process.cwd(), 'uploads', imageName);
      try {
        await fs.unlink(imagePath);
      } catch (fileError) {
        if (fileError.code !== 'ENOENT') {
          console.error('Could not delete product image:', fileError);
        }
      }
    }

    return res.status(200).json({
      message: 'Product deleted successfully.',
      productId: numericId,
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({
      message: error.message || 'Unable to delete product.',
    });
  }
};
