const orders = require('../models/orderModel')

// // add order
exports.addOrderController = async (req, res) => {
    console.log("Inside addOrderController");

    const userMail = req.payload
    const { username, phone, items, address, paymentMethod } = req.body

    const newOrder = await orders.create({ userMail, username, phone, items, address,  paymentMethod })
    res.status(201).json(newOrder)

}

// // get all orders
exports.getAllOrdersController = async (req,res)=>{
    console.log("Inside getAllOrdersController");
    const allOrders = await orders.find().sort({createdAt:-1})
    res.status(200).json(allOrders)
}

// to view single order details
exports.viewOrderController = async (req,res)=>{
    console.log("Inside viewOrderController");
    const {id} = req.params
    const orderDetails = await orders.findById({_id:id})
    res.status(200).json(orderDetails)
}


// Admin: update an order from Placed -> Shipped
// or Shipped -> Delivered.
exports.updateOrderStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!["Shipped", "Delivered"].includes(orderStatus)) {
      return res.status(400).json({
        message: "Status must be Shipped or Delivered.",
      });
    }

    const order = await orders.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // Only allow the next valid status transition.
    if (
      order.orderStatus === "Placed" &&
      orderStatus === "Shipped"
    ) {
      order.orderStatus = "Shipped";
    } else if (
      order.orderStatus === "Shipped" &&
      orderStatus === "Delivered"
    ) {
      order.orderStatus = "Delivered";
    } else {
      return res.status(400).json({
        message: `Cannot change order status from ${order.orderStatus} to ${orderStatus}.`,
      });
    }

    await order.save();

    return res.status(200).json({
      message: `Order marked as ${order.orderStatus}.`,
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      message: "Failed to update order status.",
    });
  }
};

// Customer: cancel their own order before it ships.
exports.cancelMyOrderController = async (req, res) => {
  try {
    const { id } = req.params;

    // jwtMiddleware must set req.payload to the authenticated
    // customer's email, as used by addOrderController.
    const userMail = req.payload;

    const order = await orders.findOne({
      _id: id,
      userMail,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (order.orderStatus !== "Placed") {
      return res.status(400).json({
        message:
          "You can only cancel an order before it has been shipped.",
      });
    }

    order.orderStatus = "Cancelled";
    await order.save();

    return res.status(200).json({
      message: "Your order has been cancelled.",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    return res.status(500).json({
      message: "Failed to cancel order.",
    });
  }
};


// Get orders belonging to the logged-in user
exports.getMyOrdersController = async (req, res) => {
    try {
        console.log("Inside getMyOrdersController");

        const userMail = req.payload;

        const myOrders = await orders
            .find({ userMail })
            .sort({ createdAt: -1 });

        res.status(200).json(myOrders);
    } catch (error) {
        console.error("Get my orders error:", error);
        res.status(500).json({
            message: "Failed to fetch your orders"
        });
    }
};