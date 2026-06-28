import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  image_url: { type: String, required: true },
  link: { type: String },
  type: { type: String, enum: ['home', 'offer', 'category', 'popup'], default: 'home' },
  position: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Banner', bannerSchema);
