"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualProduct = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const manualProductSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    price: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    image: { type: String, required: false },
    folderId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Folder', default: null },
    inStock: { type: Boolean, default: null },
    stockStatus: { type: String, default: null }, // "In Stock", "Out of Stock", "Limited Stock", etc.
    lastStockChecked: { type: Date, default: null },
});
exports.ManualProduct = mongoose_1.default.model('ManualProduct', manualProductSchema);
