exports.addToCartController = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;
    if (!productId || !size) {
      return res.status(400).json({ message: 'productId and size are required.' });
    }
    const result = await cartService.addToCart({
      userId: Number(req.payload),
      productId: Number(productId),
      size,
      quantity: quantity ?? 1,
    });
    return res
      .status(result.updated ? 200 : 201)
      .json({ message: result.updated ? 'Cart quantity updated' : 'Item added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

exports.cart = async (req, res) => {
  try {
    const result = await cartService.getCart(Number(req.payload));
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message
    });
  }
};

exports.removeCartItemController = async (req, res) => {
  try {
    await cartService.removeFromCart(
      Number(req.params.cartId),
      Number(req.payload)
    );

    res.status(200).json({ message: 'Cart item removed' });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message
    });
  }
};

exports.removeAllCartItemsController = async (req, res) => {
  try {
    await cartService.clearCart(Number(req.payload));

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message
    });
  }
};

exports.incrementQuantityController = async (req, res) => {
  try {
    const updated = await cartService.updateQuantity(Number(req.params.cartId), Number(req.payload), +1);
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Increment quantity error:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

exports.decrementQuantityController = async (req, res) => {
  try {
    const updated = await cartService.updateQuantity(Number(req.params.cartId), Number(req.payload), -1);
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Decrement quantity error:', error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};