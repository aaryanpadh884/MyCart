import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  productId: string;
  productType: 'tracked' | 'manual';
  userId?: string; // For future user system
  notifyOnPriceChange: boolean;
  notifyOnStockChange: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  productId: {
    type: String,
    required: true,
    index: true
  },
  productType: {
    type: String,
    enum: ['tracked', 'manual'],
    required: true
  },
  userId: {
    type: String,
    default: 'default' // For now, all notifications are for the default user
  },
  notifyOnPriceChange: {
    type: Boolean,
    default: true
  },
  notifyOnStockChange: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
NotificationSchema.index({ productId: 1, productType: 1, userId: 1 }, { unique: true });

export default mongoose.model<INotification>('Notification', NotificationSchema); 