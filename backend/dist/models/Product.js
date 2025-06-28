"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const productSchema = new mongoose_1.default.Schema({
    url: { type: String, required: true },
    name: { type: String, required: false },
    price: { type: Number, default: null },
    lastChecked: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    image: { type: String, required: false },
    folderId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Folder', default: null },
    inStock: { type: Boolean, default: null, required: false },
    stockStatus: { type: String, default: null }, // "In Stock", "Out of Stock", "Limited Stock", etc.
    lastStockChecked: { type: Date, default: null },
});
exports.Product = mongoose_1.default.model('Product', productSchema);
