require('dotenv').config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Product } from './models/Product';
import { scrapeProductDetails } from './utils/scraper';
import { ManualProduct } from './models/ManualProduct';
import { Folder } from './models/Folder';
import Notification from './models/Notification';
import cron from 'node-cron';
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' 
    ? true  // Allow all origins in production
    : /http:\/\/localhost:\d+/  // Only localhost in development
}));
app.use(express.json());
app.use((req, res, next) => { console.log(`${req.method} ${req.url}`); next(); });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/item-tracker';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/submit', async (req, res) => {
  const { url, folderId, name: userName } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    console.log(`[DEBUG] Starting scrape for URL: ${url}`);
    const { price, image, inStock, stockStatus } = await scrapeProductDetails(url);
    console.log(`[DEBUG] Scraper returned:`, { price, image, inStock, stockStatus, priceType: typeof price });
    const lastChecked = typeof price === 'number' ? new Date() : undefined;
    
    // Check for CAPTCHA first
    if (price === 'CAPTCHA') {
      console.error('CAPTCHA detected:', { url });
      return res.status(400).json({ error: 'CAPTCHA Required. Please add manually.' });
    }
    
    // Check for price not found
    if (price === null) {
      console.error('Price not found:', { url });
      return res.status(400).json({ error: 'Price not found. Please add manually.' });
    }
    
    // Check for unexpected price type
    if (typeof price !== 'number') {
      console.error('Unexpected price type:', { price, priceType: typeof price });
      return res.status(400).json({ error: 'Unexpected error: price is not a number.' });
    }
    
    // Use provided name or extract from URL as fallback
    const productName = userName || `Product from ${new URL(url).hostname}`;
    
    const productData: any = { 
      url, 
      name: productName, 
      price, 
      lastChecked, 
      image, 
      folderId 
    };
    if (inStock !== undefined && stockStatus) {
      productData.inStock = inStock;
      productData.stockStatus = stockStatus;
      productData.lastStockChecked = new Date();
    }
    const product = new Product(productData);
    await product.save();
    res.json({ message: 'Product URL submitted successfully', name: productData.name, price, image, inStock, stockStatus });
  } catch (err) {
    console.error('Failed to save product URL:', err);
    console.error('Error details:', { message: (err as Error).message, stack: (err as Error).stack });
    res.status(500).json({ error: 'Failed to save product URL' });
  }
});

app.post('/api/check-price', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    const { price, image, inStock, stockStatus } = await scrapeProductDetails(url);
    if (price === 'CAPTCHA') {
      return res.status(400).json({ error: 'CAPTCHA Required. Please add manually.' });
    }
    if (price === null) {
      return res.status(400).json({ error: 'Price not found. Please add manually.' });
    }
    if (typeof price !== 'number') {
      return res.status(400).json({ error: 'Unexpected error: price is not a number.' });
    }
    const updateData: any = { price, lastChecked: new Date() };
    if (inStock !== undefined && stockStatus) {
      updateData.inStock = inStock;
      updateData.stockStatus = stockStatus;
      updateData.lastStockChecked = new Date();
    }
    const product = await Product.findOneAndUpdate(
      { url },
      updateData,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Price updated successfully', product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check price' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().populate('folderId').sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Manual Products API
app.post('/api/manual-products', async (req, res) => {
  const { name, url, price, image, folderId, inStock, stockStatus, lastStockChecked } = req.body;
  if (!name || !url || typeof price !== 'number') {
    return res.status(400).json({ error: 'Name, URL, and price are required' });
  }
  try {
    const manualProductData: any = { name, url, price, image, folderId };
    
    if (inStock !== undefined) {
      manualProductData.inStock = inStock;
    }
    if (stockStatus) {
      manualProductData.stockStatus = stockStatus;
    }
    if (lastStockChecked) {
      manualProductData.lastStockChecked = new Date(lastStockChecked);
    }
    
    const manualProduct = new ManualProduct(manualProductData);
    await manualProduct.save();
    res.json({ message: 'Manual product added', manualProduct });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add manual product' });
  }
});

app.get('/api/manual-products', async (req, res) => {
  try {
    const manualProducts = await ManualProduct.find().populate('folderId').sort({ createdAt: -1 });
    res.json(manualProducts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch manual products' });
  }
});

app.delete('/api/manual-products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ManualProduct.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Manual product not found' });
    }
    res.json({ message: 'Manual product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete manual product' });
  }
});

// Folder API endpoints
app.post('/api/folders', async (req, res) => {
  const { name, description, color } = req.body;
  console.log('Creating folder with data:', { name, description, color });
  
  if (!name) {
    console.log('Folder creation failed: name is required');
    return res.status(400).json({ error: 'Folder name is required' });
  }
  try {
    const folder = new Folder({ name, description, color });
    console.log('Folder object created:', folder);
    await folder.save();
    console.log('Folder saved successfully:', folder);
    res.json({ message: 'Folder created successfully', folder });
  } catch (err) {
    console.error('Error creating folder:', err);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

app.get('/api/folders', async (req, res) => {
  try {
    const folders = await Folder.find().sort({ createdAt: -1 });
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

app.put('/api/folders/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;
  try {
    const folder = await Folder.findByIdAndUpdate(
      id,
      { name, description, color, updatedAt: new Date() },
      { new: true }
    );
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json({ message: 'Folder updated successfully', folder });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

app.delete('/api/folders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Remove folder reference from all products
    await Product.updateMany({ folderId: id }, { folderId: null });
    await ManualProduct.updateMany({ folderId: id }, { folderId: null });
    
    const deleted = await Folder.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json({ message: 'Folder deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Add endpoint to move products to folders
app.post('/api/products/:id/move', async (req, res) => {
  const { id } = req.params;
  const { folderId } = req.body;
  try {
    const product = await Product.findByIdAndUpdate(
      id,
      { folderId },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product moved to folder successfully', product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to move product to folder' });
  }
});

app.post('/api/manual-products/:id/move', async (req, res) => {
  const { id } = req.params;
  const { folderId } = req.body;
  try {
    const manualProduct = await ManualProduct.findByIdAndUpdate(
      id,
      { folderId },
      { new: true }
    );
    if (!manualProduct) {
      return res.status(404).json({ error: 'Manual product not found' });
    }
    res.json({ message: 'Manual product moved to folder successfully', manualProduct });
  } catch (err) {
    res.status(500).json({ error: 'Failed to move manual product to folder' });
  }
});

// Notification API endpoints
app.post('/api/notifications', async (req, res) => {
  const { productId, productType, notifyOnPriceChange, notifyOnStockChange } = req.body;
  if (!productId || !productType) {
    return res.status(400).json({ error: 'Product ID and product type are required' });
  }
  try {
    const notification = new Notification({
      productId,
      productType,
      notifyOnPriceChange: notifyOnPriceChange !== false, // Default to true
      notifyOnStockChange: notifyOnStockChange !== false // Default to true
    });
    await notification.save();
    res.json({ message: 'Notification preferences saved', notification });
  } catch (err) {
    if ((err as any).code === 11000) {
      // Duplicate key error - update existing notification
      try {
        const updated = await Notification.findOneAndUpdate(
          { productId, productType, userId: 'default' },
          { notifyOnPriceChange, notifyOnStockChange },
          { new: true, upsert: true }
        );
        res.json({ message: 'Notification preferences updated', notification: updated });
      } catch (updateErr) {
        res.status(500).json({ error: 'Failed to update notification preferences' });
      }
    } else {
      res.status(500).json({ error: 'Failed to save notification preferences' });
    }
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: 'default' });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.delete('/api/notifications/:productId/:productType', async (req, res) => {
  const { productId, productType } = req.params;
  try {
    const deleted = await Notification.findOneAndDelete({
      productId,
      productType,
      userId: 'default'
    });
    if (!deleted) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification preferences removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove notification preferences' });
  }
});

// --- EMAIL NOTIFICATION SETUP ---
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'your@email.com'; // Set this in your .env file
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Set this in your .env file
    pass: process.env.GMAIL_APP_PASSWORD // Use an App Password, not your main Gmail password
  }
});
async function sendNotificationEmail(subject: string, text: string) {
  await transporter.sendMail({
    from: `MyCart <${process.env.GMAIL_USER}>`,
    to: NOTIFICATION_EMAIL,
    subject,
    text
  });
}

// Schedule a cron job to update all tracked product prices and stock status at 9:00am America/New_York time daily
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily price and stock update for all tracked products...');
  let changes = [];
  try {
    // Get all notifications to check which products should trigger emails
    const notifications = await Notification.find({ userId: 'default' });
    const notificationMap = new Map();
    notifications.forEach(n => {
      notificationMap.set(`${n.productId}-${n.productType}`, n);
    });

    // Update tracked products
    const products = await Product.find();
    for (const product of products) {
      try {
        const { price, inStock, stockStatus } = await scrapeProductDetails(product.url);
        let updated = false;
        let changeMsg = '';
        let shouldNotify = false;
        
        // Check if this product has notifications enabled
        const notification = notificationMap.get(`${product._id}-tracked`);
        
        // Update price if changed
        if (typeof price === 'number' && price !== product.price) {
          changeMsg += `Price changed for ${product.name || product.url}: $${product.price} → $${price}\n`;
          product.price = price;
          product.lastChecked = new Date();
          updated = true;
          // Check if price notifications are enabled
          if (notification?.notifyOnPriceChange) {
            shouldNotify = true;
          }
          console.log(`Updated price for ${product.name || product.url}: $${price}`);
        } else if (typeof price === 'number') {
          product.lastChecked = new Date();
          console.log(`Checked price for ${product.name || product.url}: $${price} (no change)`);
        } else if (price !== null) {
          console.log(`Failed to update price for ${product.name || product.url}: ${price}`);
        } else {
          console.log(`Failed to update price for ${product.name || product.url}`);
        }
        
        // Update stock status if available
        if (inStock !== undefined && stockStatus) {
          if (product.inStock !== inStock || product.stockStatus !== stockStatus) {
            changeMsg += `Stock changed for ${product.name || product.url}: ${product.stockStatus} → ${stockStatus}\n`;
            updated = true;
            // Check if stock notifications are enabled
            if (notification?.notifyOnStockChange) {
              shouldNotify = true;
            }
          }
          product.inStock = inStock;
          product.stockStatus = stockStatus;
          product.lastStockChecked = new Date();
          if (updated) {
            console.log(`Updated stock status for ${product.name || product.url}: ${stockStatus} (inStock: ${inStock})`);
          }
        }
        
        if (updated) {
          await product.save();
          if (changeMsg && shouldNotify) {
            changes.push(changeMsg);
          }
        }
      } catch (err) {
        console.error(`Error updating ${product.name || product.url}:`, err);
      }
    }

    // Update manual products
    const manualProducts = await ManualProduct.find();
    for (const product of manualProducts) {
      try {
        const { price, inStock, stockStatus } = await scrapeProductDetails(product.url);
        let updated = false;
        let changeMsg = '';
        let shouldNotify = false;
        
        // Check if this product has notifications enabled
        const notification = notificationMap.get(`${product._id}-manual`);
        
        // Update price if changed
        if (typeof price === 'number' && price !== product.price) {
          changeMsg += `Price changed for ${product.name || product.url}: $${product.price} → $${price}\n`;
          product.price = price;
          updated = true;
          // Check if price notifications are enabled
          if (notification?.notifyOnPriceChange) {
            shouldNotify = true;
          }
          console.log(`Updated price for ${product.name || product.url}: $${price}`);
        } else if (typeof price === 'number') {
          console.log(`Checked price for ${product.name || product.url}: $${price} (no change)`);
        } else if (price !== null) {
          console.log(`Failed to update price for ${product.name || product.url}: ${price}`);
        } else {
          console.log(`Failed to update price for ${product.name || product.url}`);
        }
        
        // Update stock status if available
        if (inStock !== undefined && stockStatus) {
          if (product.inStock !== inStock || product.stockStatus !== stockStatus) {
            changeMsg += `Stock changed for ${product.name || product.url}: ${product.stockStatus} → ${stockStatus}\n`;
            updated = true;
            // Check if stock notifications are enabled
            if (notification?.notifyOnStockChange) {
              shouldNotify = true;
            }
          }
          product.inStock = inStock as boolean;
          product.stockStatus = stockStatus;
          product.lastStockChecked = new Date();
          if (updated) {
            console.log(`Updated stock status for ${product.name || product.url}: ${stockStatus} (inStock: ${inStock})`);
          }
        }
        
        if (updated) {
          await product.save();
          if (changeMsg && shouldNotify) {
            changes.push(changeMsg);
          }
        }
      } catch (err) {
        console.error(`Error updating ${product.name || product.url}:`, err);
      }
    }
    
    // Send notification if there were any changes for products with notifications enabled
    if (changes.length > 0) {
      await sendNotificationEmail(
        'MyCart: Product Price/Stock Change Notification',
        `The following changes were detected during the daily refresh:\n\n${changes.join('\n')}`
      );
      console.log('Notification email sent.');
    }
  } catch (err) {
    console.error('Error running daily price and stock update:', err);
  }
}, {
  timezone: 'America/New_York'
});

app.post('/api/check-stock', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    const { inStock, stockStatus } = await scrapeProductDetails(url);
    if (inStock === undefined || !stockStatus) {
      return res.status(400).json({ error: 'Failed to check stock status' });
    }
    
    const product = await Product.findOneAndUpdate(
      { url },
      { 
        inStock, 
        stockStatus, 
        lastStockChecked: new Date() 
      },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Stock status updated successfully', product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check stock status' });
  }
});

app.post('/api/check-stock-manual', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    const { inStock, stockStatus } = await scrapeProductDetails(url);
    if (inStock === undefined || !stockStatus) {
      return res.status(400).json({ error: 'Failed to check stock status' });
    }
    
    const manualProduct = await ManualProduct.findOneAndUpdate(
      { url },
      { 
        inStock, 
        stockStatus, 
        lastStockChecked: new Date() 
      },
      { new: true }
    );
    
    if (!manualProduct) {
      return res.status(404).json({ error: 'Manual product not found' });
    }
    
    res.json({ message: 'Stock status updated successfully', manualProduct });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check stock status' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { name, price, inStock, stockStatus } = req.body;
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, inStock, stockStatus },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// TEMPORARY: Test email endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    await sendNotificationEmail('MyCart Test Email', 'This is a test email from your MyCart backend.');
    res.json({ message: 'Test email sent!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send test email', details: (err as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 