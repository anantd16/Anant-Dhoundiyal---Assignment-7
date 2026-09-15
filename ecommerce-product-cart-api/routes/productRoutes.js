const express = require('express');
const router = express.Router();
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const validateProduct = require('../middleware/validateProduct');

// GET /api/products?category=&minPrice=&maxPrice=&inStock=&sort=&search=
router.get('/', listProducts);

// GET /api/products/:id
router.get('/:id', getProduct);

// POST /api/products (Admin route)
router.post('/', validateProduct, createProduct);

// PUT /api/products/:id
router.put('/:id', validateProduct, updateProduct);

// DELETE /api/products/:id
router.delete('/:id', deleteProduct);

module.exports = router;
