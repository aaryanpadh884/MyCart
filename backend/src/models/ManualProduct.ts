import mongoose from 'mongoose';

const manualProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  image: { type: String, required: false },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  inStock: { type: Boolean, default: null },
  stockStatus: { type: String, default: null }, // "In Stock", "Out of Stock", "Limited Stock", etc.
  lastStockChecked: { type: Date, default: null },
});

export const ManualProduct = mongoose.model('ManualProduct', manualProductSchema); 