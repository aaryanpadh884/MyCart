"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Folder = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const folderSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#007bff' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
exports.Folder = mongoose_1.default.model('Folder', folderSchema);
