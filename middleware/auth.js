import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jhatpat_super_secret_key_123';

export default function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded.admin;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
}
