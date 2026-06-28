import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  customer_name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  images: [{ type: String }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  is_flagged: { type: Boolean, default: false },
  admin_reply: { type: String }
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
