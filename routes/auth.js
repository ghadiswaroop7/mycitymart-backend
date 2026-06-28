import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'jhatpat_super_secret_key_123';

// @route   POST /api/admin/login
// @desc    Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check for admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Create payload
    const payload = {
      admin: {
        id: admin.id,
        role: admin.role
      }
    };
    
    // Sign token
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          token,
          admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/admin/setup
// @desc    Setup initial superadmin (Run once)
router.post('/setup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }
    
    admin = new Admin({
      name,
      email,
      password,
      role: 'superadmin'
    });
    
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);
    
    await admin.save();
    
    res.json({ success: true, message: 'Superadmin created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
