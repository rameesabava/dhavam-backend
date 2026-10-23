// const orders = require('../models/orderModel')

// // add order
// exports.addOrderController = async (req, res) => {
//     console.log("Inside addOrderController");

//     const userMail = req.payload
//     const { username, phone, items, address, totalAmount, paymentMethod } = req.body

//     const newOrder = await orders.create({ userMail, username, phone, items, address, totalAmount, paymentMethod })
//     res.status(201).json(newOrder)

// }

// // get all orders
// exports.getAllOrdersController = async (req,res)=>{
//     console.log("Inside getAllOrdersController");
//     const allOrders = await orders.find().sort({createdAt:-1})
//     res.status(200).json(allOrders)
// }

// // to view single order details
// exports.viewOrderController = async (req,res)=>{
//     console.log("Inside viewOrderController");
//     const {id} = req.params
//     const orderDetails = await orders.findById({_id:id})
//     res.status(200).json(orderDetails)
// }

// // to mark order status as shipped
// exports.updateOrderStatusController = async (req,res)=>{
//     console.log("Inside updateOrderStatusController");
//     const {id} = req.params
//     const updatedStatus = await orders.findByIdAndUpdate({_id:id},{orderStatus:"Shipped"},{new:true})
//     res.status(200).json(updatedStatus)
// }