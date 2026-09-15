const { readData, writeData } = require('../utils/fileHelper');

const PRODUCTS_FILE = 'products.json';
const CARTS_FILE = 'carts.json';

function computeCartTotal(items) {
  return items.reduce((sum, item) => sum + item.itemTotal, 0);
}

async function getOrCreateCart(userId, carts) {
  let cart = carts.find((c) => c.userId === userId);
  if (!cart) {
    cart = { userId, items: [], cartTotal: 0, updatedAt: new Date().toISOString() };
    carts.push(cart);
  }
  return cart;
}

/**
 * GET /api/cart — view current user's cart with calculated total
 */
async function getCart(req, res) {
  try {
    const carts = await readData(CARTS_FILE);
    const cart = carts.find((c) => c.userId === req.session.user.id);

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: { userId: req.session.user.id, items: [], cartTotal: 0 }
      });
    }

    return res.status(200).json({ success: true, data: cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/cart/items — add product to cart, validating stock availability
 */
async function addItem(req, res) {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'productId and quantity are required' });
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive integer' });
    }

    const products = await readData(PRODUCTS_FILE);
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const carts = await readData(CARTS_FILE);
    const cart = await getOrCreateCart(req.session.user.id, carts);

    const existingItem = cart.items.find((i) => i.productId === productId);
    const requestedTotalQty = (existingItem ? existingItem.quantity : 0) + quantity;

    if (requestedTotalQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${product.stock} unit(s) available.`
      });
    }

    if (existingItem) {
      existingItem.quantity = requestedTotalQty;
      existingItem.itemTotal = existingItem.quantity * existingItem.unitPrice;
    } else {
      cart.items.push({
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity,
        itemTotal: product.price * quantity
      });
    }

    cart.cartTotal = computeCartTotal(cart.items);
    cart.updatedAt = new Date().toISOString();

    await writeData(CARTS_FILE, carts);

    return res.status(200).json({ success: true, message: 'Item added to cart', data: cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /api/cart/items/:productId — remove specific product from cart
 */
async function removeItem(req, res) {
  try {
    const carts = await readData(CARTS_FILE);
    const cart = carts.find((c) => c.userId === req.session.user.id);

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart is empty' });
    }

    const itemIndex = cart.items.findIndex((i) => i.productId === req.params.productId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Product not in cart' });
    }

    cart.items.splice(itemIndex, 1);
    cart.cartTotal = computeCartTotal(cart.items);
    cart.updatedAt = new Date().toISOString();

    await writeData(CARTS_FILE, carts);

    return res.status(200).json({ success: true, message: 'Item removed from cart', data: cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/cart/checkout — simulate order placement & decrement product stock
 */
async function checkout(req, res) {
  try {
    const carts = await readData(CARTS_FILE);
    const cartIndex = carts.findIndex((c) => c.userId === req.session.user.id);

    if (cartIndex === -1 || carts[cartIndex].items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    const cart = carts[cartIndex];
    const products = await readData(PRODUCTS_FILE);

    // Verify stock is still sufficient for every item before committing anything
    for (const item of cart.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.name} is no longer available`
        });
      }
      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} unit(s) left.`
        });
      }
    }

    // All checks passed — decrement stock for each item
    for (const item of cart.items) {
      const product = products.find((p) => p.id === item.productId);
      product.stock -= item.quantity;
    }
    await writeData(PRODUCTS_FILE, products);

    const order = {
      userId: cart.userId,
      items: cart.items,
      orderTotal: cart.cartTotal,
      placedAt: new Date().toISOString()
    };

    // Clear the cart after successful checkout
    carts[cartIndex] = { userId: cart.userId, items: [], cartTotal: 0, updatedAt: new Date().toISOString() };
    await writeData(CARTS_FILE, carts);

    return res.status(200).json({ success: true, message: 'Order placed successfully', data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getCart, addItem, removeItem, checkout };
