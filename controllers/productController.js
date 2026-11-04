const pool = require("../config/db");
const fs = require("fs/promises");
const path = require("path");

// Add product (Admin)
exports.addProductController = async (req, res) => {
    try {
        const { name, model, category, brand, type, description, price } = req.body;

        const uploadimage = req.file
            ? `/uploads/${req.file.filename}`
            : req.body.image;

        if (!name || !model || !category || !brand || !description || !uploadimage) {
            return res.status(400).json({
                message: "Name, model, category, brand, description, and product image are required.",
            });
        }

        const productPrice = parseFloat(price) || 0.00;

        const [result] = await pool.query(
            `INSERT INTO products (name, model, category, brand, type, description, price, image) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name.trim(),
                model.trim(),
                category.trim(),
                brand.trim(),
                (type || "Standard").trim(),
                description.trim(),
                productPrice,
                uploadimage
            ]
        );

        const [newProduct] = await pool.query("SELECT * FROM products WHERE id = ?", [result.insertId]);

        return res.status(201).json(newProduct[0]);
    } catch (error) {
        console.error("Add product error:", error);
        return res.status(500).json({
            message: error.message || "Unable to add product.",
        });
    }
};

// Get all products (with optional search, category, and brand filters)
exports.getAllProductsController = async (req, res) => {
    try {
        const { search, category, brand } = req.query;

        let query = "SELECT * FROM products WHERE 1=1";
        const params = [];

        if (category && category !== "All") {
            query += " AND category = ?";
            params.push(category);
        }

        if (brand && brand !== "All") {
            query += " AND brand = ?";
            params.push(brand);
        }

        if (search && search.trim() !== "") {
            const searchTerm = `%${search.trim()}%`;
            query += " AND (name LIKE ? OR model LIKE ? OR brand LIKE ? OR category LIKE ? OR type LIKE ? OR description LIKE ?)";
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += " ORDER BY id DESC";

        const [products] = await pool.query(query, params);
        return res.status(200).json(products);
    } catch (error) {
        console.error("Get products error:", error);
        return res.status(500).json({
            message: "Unable to fetch products.",
        });
    }
};

// View one product (including its reviews)
exports.viewProductController = async (req, res) => {
    try {
        const { id } = req.params;

        const [products] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);

        if (products.length === 0) {
            return res.status(404).json({
                message: "Product not found.",
            });
        }

        const product = products[0];

        // Fetch reviews for this product
        const [reviews] = await pool.query(
            "SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC",
            [id]
        );

        const avgRating = reviews.length > 0 
            ? (reviews.reduce((acc, r) => acc + Number(r.rating), 0) / reviews.length).toFixed(1)
            : 0;

        return res.status(200).json({
            ...product,
            reviews,
            avgRating: Number(avgRating),
            reviewCount: reviews.length
        });
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

        const [existing] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                message: "Product not found.",
            });
        }

        const current = existing[0];
        const name = req.body.name !== undefined ? req.body.name.trim() : current.name;
        const model = req.body.model !== undefined ? req.body.model.trim() : current.model;
        const category = req.body.category !== undefined ? req.body.category.trim() : current.category;
        const brand = req.body.brand !== undefined ? req.body.brand.trim() : current.brand;
        const type = req.body.type !== undefined ? req.body.type.trim() : current.type;
        const description = req.body.description !== undefined ? req.body.description.trim() : current.description;
        const price = req.body.price !== undefined ? parseFloat(req.body.price) : current.price;

        let image = current.image;
        if (req.file) {
            image = `/uploads/${req.file.filename}`;
        } else if (req.body.image) {
            image = req.body.image;
        }

        await pool.query(
            `UPDATE products SET name = ?, model = ?, category = ?, brand = ?, type = ?, description = ?, price = ?, image = ? 
             WHERE id = ?`,
            [name, model, category, brand, type, description, price, image, id]
        );

        const [updatedRows] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);

        return res.status(200).json({
            message: "Product updated successfully.",
            product: updatedRows[0],
        });
    } catch (error) {
        console.error("Update product error:", error);
        return res.status(500).json({
            message: error.message || "Unable to update product.",
        });
    }
};

// Delete a product (Admin)
exports.deleteProductController = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                message: "Product not found.",
            });
        }

        const product = existing[0];

        // Delete from database
        await pool.query("DELETE FROM products WHERE id = ?", [id]);

        // Clean up uploaded image file if stored in local /uploads
        if (product.image && product.image.startsWith("/uploads/")) {
            const fileName = path.basename(product.image);
            const filePath = path.join(process.cwd(), "uploads", fileName);
            try {
                await fs.unlink(filePath);
            } catch (err) {
                // Ignore if already deleted
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
