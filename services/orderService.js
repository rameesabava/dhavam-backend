// services/orderService.js
const db = require('./dbClient');

async function query(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

/* Create an order from cart items */
exports.createOrder = async ({ userId, paymentMethod = 'COD' }) => {
  // 1️⃣ fetch cart items with price
  const cartItems = await query(
    `SELECT ci.productId, ci.size, ci.quantity, ps.price
     FROM CartItem ci
     JOIN ProductSize ps ON ps.productId = ci.productId AND ps.size = ci.size
     WHERE ci.userId = ?`,
    [userId]
  );

  if (!cartItems.length) {
    const err = new Error('Cart is empty');
    err.status = 400;
    throw err;
  }

  // 2️⃣ calculate total
  const total = cartItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  // 3️⃣ create order row
  const orderRes = await query(
    `INSERT INTO \`Order\` (userId, totalAmount, paymentMethod) VALUES (?,?,?)`,
    [userId, total, paymentMethod]
  );
  const orderId = orderRes.insertId;

  // 4️⃣ insert order items
  for (const i of cartItems) {
    await query(
      `INSERT INTO OrderItem (orderId, productId, size, price, quantity)
       VALUES (?,?,?,?,?)`,
      [orderId, i.productId, i.size, i.price, i.quantity]
    );
  }

  // 5️⃣ clear cart
  await query('DELETE FROM CartItem WHERE userId = ?', [userId]);

  // Return order summary
  const [order] = await query('SELECT * FROM `Order` WHERE id = ?', [orderId]);
  const items = await query('SELECT * FROM OrderItem WHERE orderId = ?', [orderId]);
  return { order, items };
};

/* Get orders for a user (includes items) */
exports.getOrdersByUser = async (userId) => {
  const orders = await query('SELECT * FROM `Order` WHERE userId = ?', [userId]);
  for (const o of orders) {
    o.items = await query('SELECT * FROM OrderItem WHERE orderId = ?', [o.id]);
  }
  return orders;
};

/* Admin: list all orders */
exports.listAllOrders = async () => {
  const orders = await query('SELECT * FROM `Order`');
  for (const o of orders) {
    o.items = await query('SELECT * FROM OrderItem WHERE orderId = ?', [o.id]);
  }
  return orders;
};