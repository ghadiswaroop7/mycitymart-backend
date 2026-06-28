import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner_name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  category: { type: String },
  images: [{ type: String }],
  timing: {
    open: { type: String }, // e.g., "09:00 AM"
    close: { type: String } // e.g., "09:00 PM"
  },
  delivery_radius_km: { type: Number, default: 5 },
  commission_percent: { type: Number, default: 10 },
  is_verified: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'blocked', 'pending'], default: 'pending' },
  metrics: {
    total_orders: { type: Number, default: 0 },
    total_revenue: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model('Shop', shopSchema);
