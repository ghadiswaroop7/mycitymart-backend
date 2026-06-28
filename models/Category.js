import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  icon: { type: String }, // Image URL
  banner: { type: String }, // Image URL
  display_order: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
