// services/productService.js
const db = require('./dbClient');

// Public URL of THIS backend (only used for old filename-only images)
const API_URL = (
  process.env.PUBLIC_API_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${process.env.PORT || 5000}`
).replace(/\/+$/, '');

function httpError(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// Full URLs (Cloudinary) are returned unchanged; bare filenames get the /uploads path
function publicImageUrl(filename) {
  if (!filename) return '';
  if (/^https?:\/\//i.test(filename)) return filename;
  return `${API_URL}/uploads/${encodeURIComponent(filename)}`;
}

async function query(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

// One shape for every page
function formatProduct(p, sizes) {
  const url = publicImageUrl(p.imageUrl);
  return {
    ...p,
    _id: String(p.id),
    group: String(p.category || '').toLowerCase(), // "whole" | "ground" | "combo"
    imageUrl: url,
    image: url,
    sizes: sizes.map((s) => ({ id: s.id, size: s.size, price: Number(s.price) })),
  };
}

/** Create a new product (admin) */
exports.createProduct = async ({ name, description, category, imageUrl, sizes = [] }) => {
  const result = await query(
    'INSERT INTO Product (name, description, category, imageUrl) VALUES (?,?,?,?)',
    [name, description ?? null, category, imageUrl ?? null]
  );
  const productId = result.insertId;

  for (const s of sizes) {
    await query(
      'INSERT INTO ProductSize (productId, size, price) VALUES (?,?,?)',
      [productId, s.size, s.price]
    );
  }

  return await exports.getProductById(productId);
};

/** Retrieve a single product, including its sizes */
exports.getProductById = async (id) => {
  const [product] = await query('SELECT * FROM Product WHERE id = ?', [id]);
  if (!product) return null;
  const sizes = await query('SELECT id, size, price FROM ProductSize WHERE productId = ?', [id]);
  return formatProduct(product, sizes);
};

/** List all products (public) */
exports.listProducts = async () => {
  const products = await query('SELECT * FROM Product ORDER BY id DESC');
  const result = [];
  for (const p of products) {
    const sizes = await query('SELECT id, size, price FROM ProductSize WHERE productId = ?', [p.id]);
    result.push(formatProduct(p, sizes));
  }
  return result;
};

/** Update an existing product (admin) */
exports.updateProduct = async (id, data) => {
  const { name, description, category, imageUrl, sizes } = data;
  const set = [];
  const params = [];

  if (name !== undefined) { set.push('name = ?'); params.push(name); }
  if (description !== undefined) { set.push('description = ?'); params.push(description); }
  if (category !== undefined) { set.push('category = ?'); params.push(category); }
  if (imageUrl !== undefined) { set.push('imageUrl = ?'); params.push(imageUrl); }

  if (set.length > 0) {
    await query(`UPDATE Product SET ${set.join(', ')} WHERE id = ?`, [...params, id]);
  }

  // Replace sizes if supplied
  if (Array.isArray(sizes)) {
    // Validate everything first so a bad row doesn't wipe the old sizes
    const clean = sizes.map((s) => {
      if (!s || !s.size || s.price === undefined || s.price === null || s.price === '') {
        throw httpError('Each size must have a size name and price.');
      }
      const price = Number(s.price);
      if (!Number.isFinite(price) || price < 0) {
        throw httpError(`Invalid price for size ${s.size}.`);
      }
      return { size: String(s.size).trim(), price };
    });

    await query('DELETE FROM ProductSize WHERE productId = ?', [id]);
    for (const s of clean) {
      await query(
        'INSERT INTO ProductSize (productId, size, price) VALUES (?,?,?)',
        [id, s.size, s.price]
      );
    }
  }

  return await exports.getProductById(id);
};

/** Delete a product (admin). Refuses if it appears in past orders. */
exports.deleteProduct = async (id) => {
  const used = await query('SELECT id FROM OrderItem WHERE productId = ? LIMIT 1', [id]);
  if (used.length) {
    throw httpError('Product has past orders and cannot be deleted.');
  }
  await query('DELETE FROM CartItem WHERE productId = ?', [id]);
  await query('DELETE FROM ProductSize WHERE productId = ?', [id]);
  await query('DELETE FROM Product WHERE id = ?', [id]);
};