import express from 'express';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ---- ORDERS ----
router.get('/admin/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('shop_id', 'name');
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.put('/admin/orders/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { status, [`delivery_timeline.${status}_at`]: new Date() } },
      { new: true }
    );
    
    // Emit socket event for real-time update
    const io = req.app.get('io');
    io.emit('orderStatusUpdated', { orderId: order._id, status });
    
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.post('/admin/orders/:id/assign-delivery', auth, async (req, res) => {
  try {
    const { partner_id } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { delivery_partner_id: partner_id, status: 'out_for_delivery', 'delivery_timeline.out_for_delivery_at': new Date() } },
      { new: true }
    );
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ---- REVIEWS ----
router.get('/products/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ product_id: req.params.id, status: 'approved' });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.post('/reviews', async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.put('/admin/reviews/:id/approve', auth, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.delete('/admin/reviews/:id', auth, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ---- NOTIFICATIONS ----
router.post('/admin/notifications/send', auth, async (req, res) => {
  try {
    // Mock logic for sending push notifications
    const { title, body, segment } = req.body;
    console.log(`Sending Push Notification to ${segment || 'All'}: ${title}`);
    res.json({ success: true, message: 'Notification sent successfully' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.get('/admin/notifications/history', auth, async (req, res) => {
  try {
    // Mock history
    res.json({ success: true, data: [] });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

export default router;
