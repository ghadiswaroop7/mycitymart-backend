import express from 'express';
import Category from '../models/Category.js';
import Banner from '../models/Banner.js';
import Shop from '../models/Shop.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ---- CATEGORIES ----
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ display_order: 1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.post('/admin/categories', auth, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.put('/admin/categories/:id', auth, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ---- BANNERS ----
router.get('/banners', async (req, res) => {
  try {
    const { type } = req.query;
    let query = { status: 'active' };
    if (type) query.type = type;
    
    const banners = await Banner.find(query).sort({ position: 1 });
    res.json({ success: true, data: banners });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.post('/admin/banners', auth, async (req, res) => {
  try {
    const banner = new Banner(req.body);
    await banner.save();
    res.json({ success: true, data: banner });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.put('/admin/banners/:id', auth, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: banner });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.delete('/admin/banners/:id', auth, async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Banner removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ---- SHOPS ----
router.get('/shops', async (req, res) => {
  try {
    // simplified geospatial search can be added later
    const shops = await Shop.find({ status: 'active' });
    res.json({ success: true, data: shops });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.get('/shops/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    res.json({ success: true, data: shop });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.post('/admin/shops', auth, async (req, res) => {
  try {
    const shop = new Shop(req.body);
    await shop.save();
    res.json({ success: true, data: shop });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.put('/admin/shops/:id', auth, async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: shop });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

export default router;
