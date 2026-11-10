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