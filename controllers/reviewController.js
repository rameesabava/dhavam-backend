const pool = require("../config/db");

// Add review for a product
exports.addReviewController = async (req, res) => {
    try {
        const userEmail = req.payload;
        const { productId, rating, comment } = req.body;

        if (!productId || !rating || !comment) {
            return res.status(400).json({
                message: "Product ID, rating, and comment are required."
            });
        }

        const numRating = parseInt(rating, 10);
        if (isNaN(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({
                message: "Rating must be an integer between 1 and 5."
            });
        }

        // Check if product exists
        const [products] = await pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [productId]);
        if (products.length === 0) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        // Fetch user name
        const [users] = await pool.query("SELECT username FROM users WHERE email = ? LIMIT 1", [userEmail]);
        const username = users.length > 0 ? users[0].username : userEmail.split("@")[0];

        const [result] = await pool.query(
            "INSERT INTO reviews (product_id, user_email, username, rating, comment) VALUES (?, ?, ?, ?, ?)",
            [productId, userEmail, username, numRating, comment.trim()]
        );

        const [newReview] = await pool.query("SELECT * FROM reviews WHERE id = ?", [result.insertId]);

        return res.status(201).json({
            message: "Review added successfully.",
            review: newReview[0]
        });
    } catch (error) {
        console.error("Add review error:", error);
        return res.status(500).json({
            message: "Failed to add review.",
            error: error.message
        });
    }
};

// Get reviews for a specific product
exports.getProductReviewsController = async (req, res) => {
    try {
        const { productId } = req.params;

        const [reviews] = await pool.query(
            "SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC",
            [productId]
        );

        return res.status(200).json(reviews);
    } catch (error) {
        console.error("Get reviews error:", error);
        return res.status(500).json({
            message: "Failed to fetch reviews.",
            error: error.message
        });
    }
};

