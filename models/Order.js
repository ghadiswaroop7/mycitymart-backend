import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  customer: {
    name: String,
    phone: String,
    address: String
  },
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  items: [{
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    price: Number,
    variant: String
  }],
  total_amount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  delivery_fee: { type: Number, default: 0 },
  final_amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'], 
    default: 'placed' 
  },
  payment_method: { type: String, enum: ['cod', 'online'], default: 'cod' },
  payment_status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  delivery_partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner' },
  delivery_timeline: {
    placed_at: Date,
    confirmed_at: Date,
    packed_at: Date,
    out_for_delivery_at: Date,
    delivered_at: Date
  }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
