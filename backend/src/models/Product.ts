import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String, required: false },
  price: { type: Number, default: null },
  lastChecked: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  image: { type: String, required: false },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  inStock: { type: Boolean, default: null, required: false },
  stockStatus: { type: String, default: null }, // "In Stock", "Out of Stock", "Limited Stock", etc.
  lastStockChecked: { type: Date, default: null },
});

export const Product = mongoose.model('Product', productSchema); 