// controllers/orderController.js
const orderService = require('../services/orderService');

/** Create a new order (checkout) */
exports.addOrderController = async (req, res) => {
  try {
    const userId = req.payload; // user ID from JWT middleware
    const { username, phone, address, paymentMethod, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart items are required.' });
    }
    const order = await orderService.createOrder({
      userId: Number(userId),
      username,
      phone,
      address,
      paymentMethod,
      items,
    });
    return res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/** Admin: list all orders */
exports.getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderService.listOrders();
    return res.status(200).json(orders);
  } catch (error) {
    console.error('List orders error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/** Admin or user: view single order */
exports.viewOrderController = async (req, res) => {
  try {
    const order = await orderService.getOrderById(Number(req.params.id));
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.status(200).json(order);
  } catch (error) {
    console.error('View order error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/** Admin: update order status */
exports.updateOrderStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expects enum value (e.g., "SHIPPED")
    const updated = await orderService.updateOrderStatus(Number(id), status);
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/** Customer: get their own orders */
exports.getMyOrdersController = async (req, res) => {
  try {
    const userId = req.payload;
    const orders = await orderService.getUserOrders(Number(userId));
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/** Customer: cancel own order (only if PENDING) */
exports.cancelMyOrderController = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(Number(id));
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.userId !== req.payload) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (order.status !== 'PENDING') {
      return res
        .status(400)
        .json({ message: 'Only pending orders can be cancelled.' });
    }
    const cancelled = await orderService.updateOrderStatus(
      Number(id),
      'CANCELLED'
    );
    return res.status(200).json(cancelled);
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({ message: error.message });
  }
};
