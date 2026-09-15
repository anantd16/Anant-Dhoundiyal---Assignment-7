const express = require('express');
const router = express.Router();
const { getCart, addItem, removeItem, checkout } = require('../controllers/cartController');
const authGuard = require('../middleware/authGuard');

router.use(authGuard);

// GET /api/cart
router.get('/', getCart);

// POST /api/cart/items
router.post('/items', addItem);

// DELETE /api/cart/items/:productId
router.delete('/items/:productId', removeItem);

// POST /api/cart/checkout
router.post('/checkout', checkout);

module.exports = router;
