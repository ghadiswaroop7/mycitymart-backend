import express from 'express';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products (public/admin)
router.get('/', async (req, res) => {
  try {
    const { category, shop_id, search, limit = 20, page = 1 } = req.query;
    
    let query = {};
    if (category) query.main_category = category;
    if (shop_id) query.shop_id = shop_id;
    if (search) query.name = { $regex: search, $options: 'i' };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('shop_id', 'name owner_name');
      
    const total = await Product.countDocuments(query);
      
    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('shop_id', 'name owner_name location');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    res.json({ success: true, data: product });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/admin/products
// @desc    Create a product
router.post('/admin/products', auth, async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    // Generate simple slug if not provided
    if (!newProduct.slug) {
      newProduct.slug = newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    }
    // Generate unique product_id if not provided
    if (!newProduct.product_id) {
      newProduct.product_id = 'PRD-' + Date.now();
    }
    
    const product = await newProduct.save();
    res.json({ success: true, data: product });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Update a product
router.put('/admin/products/:id', auth, async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.json({ success: true, data: product });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete a product
router.delete('/admin/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    await product.deleteOne();
    
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
