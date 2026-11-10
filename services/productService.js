// services/productService.js
const db = require('./dbClient');

// Public URL of THIS backend. Set PUBLIC_API_URL in .env when you deploy.
const API_URL = (
  process.env.PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  `http://localhost:${process.env.PORT || 5000}`
).replace(/\/+$/, '');

function publicImageUrl(filename) {
  if (!filename) return '';
  if (/^https?:\/\//i.test(filename)) return filename;
  return `${API_URL}/uploads/${encodeURIComponent(filename)}`;
}

async function query(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

/* One shape for every page: works with both the new and the old field names */
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

// ---- keep your existing createProduct here ----

exports.getProductById = async (id) => {
  const [product] = await query('SELECT * FROM Product WHERE id = ?', [id]);
  if (!product) return null;
  const sizes = await query('SELECT id, size, price FROM ProductSize WHERE productId = ?', [id]);
  return formatProduct(product, sizes);
};

exports.listProducts = async () => {
  const products = await query('SELECT * FROM Product ORDER BY id DESC');
  const result = [];
  for (const p of products) {
    const sizes = await query('SELECT id, size, price FROM ProductSize WHERE productId = ?', [p.id]);
    result.push(formatProduct(p, sizes));
  }
  return result;
};

// ---- keep your existing updateProduct and deleteProduct here ----
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
    await query('DELETE FROM ProductSize WHERE productId = ?', [id]);
    for (const s of sizes) {
      if (!s.size || s.price === undefined || s.price === null || s.price === '') {
        throw new Error('Each size must have a size name and price.');
      }
      const price = Number(s.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error(`Invalid price for size ${s.size}.`);
      }
      await query(
        `INSERT INTO ProductSize (productId, size, price) VALUES (?,?,?)`,
        [id, s.size.trim(), price]
      );
    }
  }

  return await exports.getProductById(id);
};

/** Delete a product (admin) */
exports.deleteProduct = async (id) => {
  await query('DELETE FROM Product WHERE id = ?', [id]);
};
