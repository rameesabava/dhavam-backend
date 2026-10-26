
const carts = require('../models/cartModel');
const products = require('../models/productModel');

// Add product to cart
exports.addToCartController = async (req, res) => {
    try {
        console.log("Inside addToCartController");

        const userMail = req.payload;
        const { productId, size } = req.body;

        if (!productId || !size) {
            return res.status(400).json({
                message: "Product ID and size are required"
            });
        }

        // Find product
        const product = await products.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Check whether selected size exists
        const sizeExists = product.sizes.some(
            item => String(item) === String(size)
        );

        if (!sizeExists) {
            return res.status(400).json({
                message: "Selected size is not available"
            });
        }

        // Check product and size in the user's cart
        let existingProduct = await carts.findOne({
            userMail,
            productId,
            size: String(size)
        });

        if (existingProduct) {
            // Increase quantity for the same size
            existingProduct.quantity += 1;
            await existingProduct.save();

            return res.status(200).json({
                message: "Cart quantity updated",
                data: existingProduct
            });
        }

        // Add a new cart item
        const newItemCart = await carts.create({
            userMail,
            productId: product._id,
            productName: product.name,
            productImage: product.image,
            size: String(size),
            quantity: 1
        });

        return res.status(201).json({
            message: "Product added to cart",
            data: newItemCart
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to add product to cart",
            error: error.message
        });
    }
};


// Get cart items
exports.getCartController = async (req, res) => {
    try {
        console.log("Inside getCartController");

        const userMail = req.payload;

        const allCartItems = await carts.find({ userMail })
            .sort({ createdAt: -1 });

        return res.status(200).json(allCartItems);

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch cart items",
            error: error.message
        });
    }
};


// Increment quantity
exports.incrementQuantityController = async (req, res) => {
    try {
        console.log("Inside incrementQuantityController");

        const userMail = req.payload;
        const { cartId } = req.params;

        const cartItem = await carts.findOne({
            _id: cartId,
            userMail
        });

        if (!cartItem) {
            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        cartItem.quantity += 1;
        await cartItem.save();

        return res.status(200).json({
            message: "Quantity increased",
            data: cartItem
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to increment quantity",
            error: error.message
        });
    }
};


// Decrement quantity
exports.decrementQuantityController = async (req, res) => {
    try {
        console.log("Inside decrementQuantityController");

        const userMail = req.payload;
        const { cartId } = req.params;

        const cartItem = await carts.findOne({
            _id: cartId,
            userMail
        });

        if (!cartItem) {
            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        if (cartItem.quantity > 1) {
            cartItem.quantity -= 1;
            await cartItem.save();

            return res.status(200).json({
                message: "Quantity decreased",
                data: cartItem
            });
        }

        await carts.findOneAndDelete({
            _id: cartId,
            userMail
        });

        return res.status(200).json({
            message: "Product removed from cart"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to decrement quantity",
            error: error.message
        });
    }
};


// Remove one cart item
exports.removeCartItemController = async (req, res) => {
    try {
        console.log("Inside removeCartItemController");

        const userMail = req.payload;
        const { cartId } = req.params;

        const removedItem = await carts.findOneAndDelete({
            _id: cartId,
            userMail
        });

        if (!removedItem) {
            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        return res.status(200).json({
            message: "Product removed from cart",
            data: removedItem
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to remove cart item",
            error: error.message
        });
    }
};


// Remove all cart items for the logged-in user
exports.removeAllCartItemsController = async (req, res) => {
    try {
        console.log("Inside removeAllCartItemsController");

        const userMail = req.payload;

        const result = await carts.deleteMany({ userMail });

        return res.status(200).json({
            message: "All cart items removed",
            deletedCount: result.deletedCount
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to clear cart",
            error: error.message
        });
    }
};
