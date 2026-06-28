import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['flat', 'percentage'], required: true },
  value: { type: Number, required: true },
  min_order_value: { type: Number, default: 0 },
  max_discount: { type: Number }, // applicable for percentage
  usage_limit: { type: Number },
  used_count: { type: Number, default: 0 },
  expiry_date: { type: Date, required: true },
  category_specific: { type: String },
  user_specific: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Coupon', couponSchema);
