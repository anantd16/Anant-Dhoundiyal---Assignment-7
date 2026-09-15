const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/fileHelper');

const PRODUCTS_FILE = 'products.json';

const SORT_OPTIONS = {
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  rating_asc: (a, b) => a.rating - b.rating,
  rating_desc: (a, b) => b.rating - a.rating,
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
};

/**
 * GET /api/products
 * Query params: category, minPrice, maxPrice, inStock, sort, search
 */
async function listProducts(req, res) {
  try {
    const { category, minPrice, maxPrice, inStock, sort, search } = req.query;

    let products = await readData(PRODUCTS_FILE);

    if (category) {
      products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (minPrice !== undefined) {
      const min = Number(minPrice);
      if (Number.isNaN(min)) {
        return res.status(400).json({ success: false, message: 'minPrice must be a number' });
      }
      products = products.filter((p) => p.price >= min);
    }

    if (maxPrice !== undefined) {
      const max = Number(maxPrice);
      if (Number.isNaN(max)) {
        return res.status(400).json({ success: false, message: 'maxPrice must be a number' });
      }
      products = products.filter((p) => p.price <= max);
    }

    if (inStock !== undefined) {
      const wantInStock = inStock === 'true';
      products = products.filter((p) => (wantInStock ? p.stock > 0 : p.stock === 0));
    }

    if (search) {
      const term = search.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(term));
    }

    if (sort) {
      const comparator = SORT_OPTIONS[sort];
      if (!comparator) {
        return res.status(400).json({
          success: false,
          message: `Invalid sort value. Allowed: ${Object.keys(SORT_OPTIONS).join(', ')}`
        });
      }
      products = [...products].sort(comparator);
    }

    return res.status(200).json({ success: true, count: products.length, data: products });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/products/:id
 */
async function getProduct(req, res) {
  try {
    const products = await readData(PRODUCTS_FILE);
    const product = products.find((p) => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/products (Admin route — validateProduct middleware runs first)
 */
async function createProduct(req, res) {
  try {
    const { name, category, price, stock, rating } = req.body;

    const products = await readData(PRODUCTS_FILE);

    const newProduct = {
      id: `prod_${uuidv4().slice(0, 8)}`,
      name,
      category,
      price,
      stock,
      rating: rating !== undefined ? rating : 0,
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    await writeData(PRODUCTS_FILE, products);

    return res.status(201).json({ success: true, message: 'Product created', data: newProduct });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PUT /api/products/:id (validateProduct middleware runs first)
 */
async function updateProduct(req, res) {
  try {
    const products = await readData(PRODUCTS_FILE);
    const index = products.findIndex((p) => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { name, category, price, stock, rating } = req.body;
    const updated = { ...products[index] };

    if (name !== undefined) updated.name = name;
    if (category !== undefined) updated.category = category;
    if (price !== undefined) updated.price = price;
    if (stock !== undefined) updated.stock = stock;
    if (rating !== undefined) updated.rating = rating;

    products[index] = updated;
    await writeData(PRODUCTS_FILE, products);

    return res.status(200).json({ success: true, message: 'Product updated', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /api/products/:id
 */
async function deleteProduct(req, res) {
  try {
    const products = await readData(PRODUCTS_FILE);
    const index = products.findIndex((p) => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    products.splice(index, 1);
    await writeData(PRODUCTS_FILE, products);

    return res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
