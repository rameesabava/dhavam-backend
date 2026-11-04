
const products = require("../models/productModel");
const fs = require("fs/promises");
const path = require("path");
// Parse sizes sent as JSON from FormData
function parseSizes(sizes) {
  if (Array.isArray(sizes)) {
    return sizes;
  }

  if (typeof sizes === "string") {
    try {
      const parsed = JSON.parse(sizes);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Support a comma-separated string as a fallback.
      return sizes
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean);
    }
  }

  return [];
}

// Add product
exports.addProductController = async (req, res) => {
  try {
    const { name, description, group, sizes } = req.body;

    const uploadimage = req.file
      ? req.file.filename
      : req.body.image;

    if (!name || !description || !uploadimage) {
      return res.status(400).json({
        message: "Name, description, and product image are required.",
      });
    }

    const productDetails = await products.create({
      name: name.trim(),
      description: description.trim(),
      group: group || "whole",
      image: uploadimage,
      sizes: parseSizes(sizes),
    });

    return res.status(201).json(productDetails);
  } catch (error) {
    console.error("Add product error:", error);

    return res.status(500).json({
 message: error.message || "Unable to add product."    });
  }
};

// Get all products
exports.getAllProductsController = async (req, res) => {
  try {
    const allProducts = await products.find();

    return res.status(200).json(allProducts);
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      message: "Unable to fetch products.",
    });
  }
};

// View one product
exports.viewProductController = async (req, res) => {
  try {
    const productDetails = await products.findById(req.params.id);

    if (!productDetails) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    return res.status(200).json(productDetails);
  } catch (error) {
    console.error("View product error:", error);

    return res.status(500).json({
      message: "Unable to fetch product.",
    });
  }
};

// Update product by admin
exports.updateProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const existingProduct = await products.findById(id);

    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    const updateData = {};

    if (req.body.name !== undefined) {
      updateData.name = req.body.name.trim();
    }

    if (req.body.description !== undefined) {
      updateData.description = req.body.description.trim();
    }

    if (req.body.group !== undefined) {
      updateData.group = req.body.group || "whole";
    }

    if (req.body.sizes !== undefined) {
      updateData.sizes = parseSizes(req.body.sizes);
    }

    // Replace the image only if a new image was uploaded.
    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedProduct = await products.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      message: error.message || "Unable to update product.",
    });
  }
};


// Delete a product by its MongoDB ID
exports.deleteProductController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    const product = await products.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    // Delete the product record first.
    await products.findByIdAndDelete(id);

    // Remove the uploaded image, if it exists.
    if (product.image) {
      const imageName = path.basename(product.image);
      const imagePath = path.join(
        process.cwd(),
        "uploads",
        imageName
      );

      try {
        await fs.unlink(imagePath);
      } catch (fileError) {
        if (fileError.code !== "ENOENT") {
          console.error("Could not delete product image:", fileError);
        }
      }
    }

    return res.status(200).json({
      message: "Product deleted successfully.",
      productId: id,
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      message: "Unable to delete product.",
    });
  }
};

