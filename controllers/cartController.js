// controllers/cartController.js
// Centralized cart operations – all routes expect a numeric user ID set by the JWT middleware.

const cartService = require('../services/cartService');

/** Add product to cart */
exports.addToCartController = async (req, res) => {
  try {
    const userId = req.payload; // numeric ID from jwtMiddleware
    const { productId, size, quantity } = req.body;
    if (!productId || !size) {
      return res.status(400).json({ message: 'productId and size are required.' });
    }
    await cartService.addToCart({
      userId: Number(userId),
      productId: Number(productId),
      size,
      quantity: quantity ?? 1,
    });
    return res.status(201).json({ message: 'Item added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/** Get cart items for logged‑in user */
exports.getCartController = async (req, res) => {
  try {
    const userId = req.payload;
    const items = await cartService.getCart(Number(userId));
    return res.status(200).json(items);
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/** Increment quantity */
exports.incrementQuantityController = async (req, res) => {
  try {
    const cartId = Number(req.params.cartId);
    const updated = await cartService.updateQuantity(cartId, +1);
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Increment quantity error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/** Decrement quantity */
exports.decrementQuantityController = async (req, res) => {
  try {
    const cartId = Number(req.params.cartId);
    const updated = await cartService.updateQuantity(cartId, -1);
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Decrement quantity error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/** Remove a cart item */
exports.removeCartItemController = async (req, res) => {
  try {
    const cartId = Number(req.params.cartId);
    await cartService.removeFromCart(cartId, Number(req.payload));
    return res.status(200).json({ message: 'Cart item removed.' });
  } catch (error) {
    console.error('Remove cart item error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/** Remove all cart items for the logged‑in user */
exports.removeAllCartItemsController = async (req, res) => {
  try {
    const userId = Number(req.payload);
    await cartService.clearCart(userId);
    return res.status(200).json({ message: 'All cart items removed.' });
  } catch (error) {
    console.error('Remove all cart items error:', error);
    return res.status(500).json({ message: error.message });
  }
};
