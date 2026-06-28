import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  addresses: [{
    label: String, // Home, Work
    street: String,
    city: String,
    state: String,
    zip: String,
    lat: Number,
    lng: Number
  }],
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  total_orders: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema);
