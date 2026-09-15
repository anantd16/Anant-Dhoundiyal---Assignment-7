/**
 * Validates product payloads on create (POST) — all fields required —
 * and on update (PUT) — only validates fields that are present.
 */
function validateProduct(req, res, next) {
  const isCreate = req.method === 'POST';
  const { name, category, price, stock, rating } = req.body;

  const errors = [];

  if (isCreate || name !== undefined) {
    if (isCreate && (!name || typeof name !== 'string' || !name.trim())) {
      errors.push('name is required and must be a non-empty string');
    }
  }

  if (isCreate || category !== undefined) {
    if (isCreate && (!category || typeof category !== 'string' || !category.trim())) {
      errors.push('category is required and must be a non-empty string');
    }
  }

  if (price !== undefined) {
    if (typeof price !== 'number' || Number.isNaN(price) || price <= 0) {
      errors.push('price must be a number greater than 0');
    }
  } else if (isCreate) {
    errors.push('price is required');
  }

  if (stock !== undefined) {
    if (!Number.isInteger(stock) || stock < 0) {
      errors.push('stock must be a non-negative integer');
    }
  } else if (isCreate) {
    errors.push('stock is required');
  }

  if (rating !== undefined) {
    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
      errors.push('rating must be a number between 0 and 5');
    }
  }

  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  next();
}

module.exports = validateProduct;
