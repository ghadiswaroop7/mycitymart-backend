import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  product_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  short_description: { type: String, maxlength: 150 },
  full_description: { type: String },
  
  // Media
  images: [{ type: String }],
  primary_image_index: { type: Number, default: 0 },
  youtube_video_url: { type: String },
  youtube_video_title: { type: String },
  
  // Pricing
  mrp: { type: Number, required: true },
  selling_price: { type: Number, required: true },
  discount_percent: { type: Number },
  wholesale_price: { type: Number },
  
  // Categories
  main_category: { type: String, required: true },
  sub_category: { type: String },
  tags: [{ type: String }],
  
  // Variants
  has_variants: { type: Boolean, default: false },
  variants: [{
    name: String, // e.g., "Size", "Color"
    options: [{
      label: String,
      price_modifier: Number,
      stock: Number,
      sku: String
    }]
  }],
  
  // Stock
  stock_quantity: { type: Number, required: true },
  low_stock_alert: { type: Number, default: 10 },
  sku: { type: String },
  
  // Details/Specs
  specifications: [{
    key: String,
    value: String
  }],
  highlights: [{ type: String }],
  
  // Delivery
  weight: { type: Number },
  dimensions: {
    l: Number,
    w: Number,
    h: Number
  },
  delivery_days: { type: Number, default: 1 },
  is_returnable: { type: Boolean, default: false },
  return_days: { type: Number, default: 0 },
  
  // Reviews
  allow_reviews: { type: Boolean, default: true },
  avg_rating: { type: Number, default: 0 },
  total_reviews: { type: Number, default: 0 },
  
  // SEO
  meta_title: { type: String },
  meta_description: { type: String },
  
  // Status
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'draft' },
  is_featured: { type: Boolean, default: false },
  is_trending: { type: Boolean, default: false },
  
  // Shop
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  seller_name: { type: String }
}, { timestamps: true });

// Pre-save to auto-calculate discount percent
productSchema.pre('save', function(next) {
  if (this.mrp && this.selling_price) {
    this.discount_percent = Math.round(((this.mrp - this.selling_price) / this.mrp) * 100);
  }
  next();
});

export default mongoose.model('Product', productSchema);
