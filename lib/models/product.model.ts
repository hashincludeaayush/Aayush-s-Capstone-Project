import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  currency: { type: String, required: true },
  image: { type: String, required: true, default: "/assets/images/trending.svg" },
  title: { type: String, required: true },
  currentPrice: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  priceHistory: [
    { 
      price: { type: Number, required: true },
      date: { type: Date, default: Date.now }
    },
  ],
  lowestPrice: { type: Number },
  highestPrice: { type: Number },
  averagePrice: { type: Number },
  discountRate: { type: Number },
  description: { type: String },
  category: { type: String },
  reviewsCount: { type: Number },
  isOutOfStock: { type: Boolean, default: false },
  analytics: {
    status: {
      type: String,
      enum: ["idle", "pending", "complete", "failed"],
      default: "idle",
    },
    requestedAt: { type: Date },
    completedAt: { type: Date },
    error: { type: String },
    data: { type: mongoose.Schema.Types.Mixed },
  },
  users: [
    {email: { type: String, required: true}}
  ], default: [],
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;