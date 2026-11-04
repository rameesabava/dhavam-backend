const pool = require('../config/db');

// Add order
exports.addOrderController = async (req, res) => {
    try {
        console.log("Inside addOrderController");

        const userEmail = req.payload;
        const { username, phone, items, address, paymentMethod, totalAmount } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Order items cannot be empty."
            });
        }

        if (!address || !phone) {
            return res.status(400).json({
                message: "Delivery address and contact phone are required."
            });
        }

        // Calculate total amount if not sent or verify
        let computedTotal = 0;
        for (const item of items) {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.quantity) || 1;
            computedTotal += price * qty;
        }

        const finalTotal = parseFloat(totalAmount) || computedTotal;

        const [result] = await pool.query(
            `INSERT INTO orders (user_email, username, phone, address, payment_method, order_status, total_amount, items_json) 
             VALUES (?, ?, ?, ?, ?, 'Placed', ?, ?)`,
            [
                userEmail,
                username || userEmail.split("@")[0],
                String(phone),
                address.trim(),
                paymentMethod || 'Cash on Delivery',
                finalTotal,
                JSON.stringify(items)
            ]
        );

        // Clear cart for this user after successful order
        await pool.query("DELETE FROM carts WHERE user_email = ?", [userEmail]);

        const [newOrder] = await pool.query("SELECT * FROM orders WHERE id = ?", [result.insertId]);

        return res.status(201).json(newOrder[0]);
    } catch (error) {
        console.error("Add order error:", error);
        return res.status(500).json({
            message: "Failed to place order.",
            error: error.message
        });
    }
};

// Get all orders (Admin)
exports.getAllOrdersController = async (req, res) => {
    try {
        console.log("Inside getAllOrdersController");
        const [allOrders] = await pool.query("SELECT * FROM orders ORDER BY id DESC");
        return res.status(200).json(allOrders);
    } catch (error) {
        console.error("Get all orders error:", error);
        return res.status(500).json({
            message: "Failed to fetch orders.",
            error: error.message
        });
    }
};

// View single order
exports.viewOrderController = async (req, res) => {
    try {
        const { id } = req.params;
        const [orders] = await pool.query("SELECT * FROM orders WHERE id = ? LIMIT 1", [id]);

        if (orders.length === 0) {
            return res.status(404).json({
                message: "Order not found."
            });
        }

        return res.status(200).json(orders[0]);
    } catch (error) {
        console.error("View order error:", error);
        return res.status(500).json({
            message: "Failed to fetch order details.",
            error: error.message
        });
    }
};

// Admin: update order status to Shipped or Delivered
exports.updateOrderStatusController = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        if (!["Shipped", "Delivered"].includes(orderStatus)) {
            return res.status(400).json({
                message: "Status must be Shipped or Delivered.",
            });
        }

        const [existing] = await pool.query("SELECT * FROM orders WHERE id = ? LIMIT 1", [id]);

        if (existing.length === 0) {
            return res.status(404).json({
                message: "Order not found.",
            });
        }

        const order = existing[0];

        // Valid status transitions: Placed -> Shipped, Shipped -> Delivered
        if (
            (order.order_status === "Placed" && orderStatus === "Shipped") ||
            (order.order_status === "Shipped" && orderStatus === "Delivered")
        ) {
            await pool.query("UPDATE orders SET order_status = ? WHERE id = ?", [orderStatus, id]);
            const [updated] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);

            return res.status(200).json({
                message: `Order marked as ${orderStatus}.`,
                order: updated[0],
            });
        } else {
            return res.status(400).json({
                message: `Cannot change order status from ${order.order_status} to ${orderStatus}.`,
            });
        }
    } catch (error) {
        console.error("Update order status error:", error);
        return res.status(500).json({
            message: "Failed to update order status.",
            error: error.message
        });
    }
};

// Customer: cancel order before it ships
exports.cancelMyOrderController = async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.payload;

        const [existing] = await pool.query(
            "SELECT * FROM orders WHERE id = ? AND user_email = ? LIMIT 1",
            [id, userEmail]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                message: "Order not found.",
            });
        }

        const order = existing[0];

        if (order.order_status !== "Placed") {
            return res.status(400).json({
                message: "You can only cancel an order before it has been shipped.",
            });
        }

        await pool.query("UPDATE orders SET order_status = 'Cancelled' WHERE id = ?", [id]);
        const [updated] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);

        return res.status(200).json({
            message: "Your order has been cancelled.",
            order: updated[0],
        });
    } catch (error) {
        console.error("Cancel order error:", error);
        return res.status(500).json({
            message: "Failed to cancel order.",
            error: error.message
        });
    }
};

// Customer: get my orders
exports.getMyOrdersController = async (req, res) => {
    try {
        console.log("Inside getMyOrdersController");
        const userEmail = req.payload;

        const [myOrders] = await pool.query(
            "SELECT * FROM orders WHERE user_email = ? ORDER BY id DESC",
            [userEmail]
        );

        return res.status(200).json(myOrders);
    } catch (error) {
        console.error("Get my orders error:", error);
        return res.status(500).json({
            message: "Failed to fetch your orders",
            error: error.message
        });
    }
};
