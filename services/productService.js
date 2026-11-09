// services/productService.js
const db = require('./dbClient');

/* Helper */
async function query(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

/* Create product with sizes */
exports.createProduct = async ({ name, description, category, imageUrl, sizes = [] }) => {
  const result = await query(
    `INSERT INTO Product (name, description, category, imageUrl) VALUES (?,?,?,?)`,
    [name, description, category, imageUrl]
  );
  const productId = result.insertId;

  // Insert sizes (price is DECIMAL)
  for (const s of sizes) {
    await query(
      `INSERT INTO ProductSize (productId, size, price) VALUES (?,?,?)`,
      [productId, s.size, s.price]
    );
  }

  // Return product w/ sizes
  const product = await exports.getProductById(productId);
  return product;
};

/* Get product by id (includes sizes) */
exports.getProductById = async (id) => {
  const [product] = await query('SELECT * FROM Product WHERE id = ?', [id]);
  if (!product) return null;
  const sizes = await query('SELECT id, size, price FROM ProductSize WHERE productId = ?', [id]);
  product.sizes = sizes;
  return product;
};

/* Update product (including sizes) */
exports.updateProduct = async (id, data) => {
  const { name, description, category, imageUrl, sizes } = data;

  // Update base fields
  const set = [];
  const params = [];
  if (name) { set.push('name = ?'); params.push(name); }
  if (description) { set.push('description = ?'); params.push(description); }
  if (category) { set.push('category = ?'); params.push(category); }
  if (imageUrl) { set.push('imageUrl = ?'); params.push(imageUrl); }

  if (set.length) {
    await query(`UPDATE Product SET ${set.join(', ')} WHERE id = ?`, [...params, id]);
  }

  // ---- Sizes handling ----
  // `sizes` is an array of objects: { id?, size, price }
  // - If `id` present → update existing row
  // - If no `id` → create new row
  // (Deletion can be added later if needed)
  if (Array.isArray(sizes)) {
    for (const s of sizes) {
      if (s.id) {
        // update
        await query(
          `UPDATE ProductSize SET size = ?, price = ? WHERE id = ? AND productId = ?`,
          [s.size, s.price, s.id, id]
        );
      } else {
        // create
        await query(
          `INSERT INTO ProductSize (productId, size, price) VALUES (?,?,?)`,
          [id, s.size, s.price]
        );
      }
    }
  }

  return await exports.getProductById(id);
};

/* Delete product (cascades sizes via foreign key ON DELETE CASCADE) */
exports.deleteProduct = async (id) => {
  await query('DELETE FROM Product WHERE id = ?', [id]);
};

/* List all products with sizes */
exports.listProducts = async () => {
  const products = await query('SELECT * FROM Product');
  for (const p of products) {
    p.sizes = await query('SELECT id, size, price FROM ProductSize WHERE productId = ?', [p.id]);
  }
  return products;
};