const express = require('express');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const reviewController = require('../controllers/reviewController');
const adminMiddleware = require('../middlewares/adminMiddleware');
const jwtMiddleware = require('../middlewares/jwtMiddleware');
const multerMiddleware = require('../middlewares/multerMiddleware');

const router = new express.Router();

// ------- Public routes -------------------------
// Register
router.post('/register', userController.registerController);
// Login
router.post('/login', userController.loginController);
// Get all products (supports ?search=&category=&brand=)
router.get('/products', productController.getAllProductsController);
// View single product (public or authenticated)
router.get('/product/:id', productController.viewProductController);
// Get product reviews
router.get('/reviews/:productId', reviewController.getProductReviewsController);

// ------------------- Admin routes ----------------------------------------
// Add product
router.post('/product/add', adminMiddleware, multerMiddleware.single('image'), productController.addProductController);
// Update product
router.put('/product/:id', adminMiddleware, multerMiddleware.single('image'), productController.updateProductController);
// Delete product
router.delete("/product/:id", adminMiddleware, productController.deleteProductController);
// Get all users
router.get('/admin/users', adminMiddleware, userController.getAllUsersController);
// Delete user
router.delete("/admin/users/:id", adminMiddleware, userController.deleteUserController);
// Get all orders
router.get('/admin/orders', adminMiddleware, orderController.getAllOrdersController);
// Update status of order (Shipped / Delivered)
router.put("/order/status/:id", adminMiddleware, orderController.updateOrderStatusController);

// ------------------------- User (Authenticated) routes -------------------
// View logged-in user's profile
router.get("/profile", jwtMiddleware, userController.getMyProfileController);
// Update logged-in user's profile
router.put("/profile", jwtMiddleware, userController.updateMyProfileController);

// Cart
router.post('/cart/add', jwtMiddleware, cartController.addToCartController);
router.get('/cart', jwtMiddleware, cartController.getCartController);
router.put('/cart/increment/:cartId', jwtMiddleware, cartController.incrementQuantityController);
router.put('/cart/decrement/:cartId', jwtMiddleware, cartController.decrementQuantityController);
router.delete('/cart/remove/:cartId', jwtMiddleware, cartController.removeCartItemController);
router.delete('/cart/remove', jwtMiddleware, cartController.removeAllCartItemsController);

// Orders
router.post('/order/add', jwtMiddleware, orderController.addOrderController);
router.get('/myOrders', jwtMiddleware, orderController.getMyOrdersController);
router.get('/order/:id', jwtMiddleware, orderController.viewOrderController);
router.put("/myOrders/cancel/:id", jwtMiddleware, orderController.cancelMyOrderController);

// Reviews
router.post('/review/add', jwtMiddleware, reviewController.addReviewController);

module.exports = router;
