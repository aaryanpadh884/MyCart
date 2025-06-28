"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const Product_1 = require("./models/Product");
const scraper_1 = require("./utils/scraper");
const ManualProduct_1 = require("./models/ManualProduct");
const Folder_1 = require("./models/Folder");
const node_cron_1 = __importDefault(require("node-cron"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
app.use((0, cors_1.default)({ origin: /http:\/\/localhost:\d+/ }));
app.use(express_1.default.json());
app.use((req, res, next) => { console.log(`${req.method} ${req.url}`); next(); });
// MongoDB connection
mongoose_1.default.connect('mongodb://localhost:27017/item-tracker')
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
        const { price, image, inStock, stockStatus } = await (0, scraper_1.scrapeProductDetails)(url);
        const lastChecked = typeof price === 'number' ? new Date() : undefined;
        if (!userName || price === 'CAPTCHA') {
            console.error('Product name missing or CAPTCHA detected:', { userName, price });
            return res.status(400).json({ error: 'CAPTCHA Required. Please add manually.' });
        }
        if (price === null) {
            console.error('Price not found:', { url });
            return res.status(400).json({ error: 'Price not found. Please add manually.' });
        }
        if (typeof price !== 'number') {
            console.error('Unexpected price type:', { price });
            return res.status(400).json({ error: 'Unexpected error: price is not a number.' });
        }
        const productData = {
            url,
            name: userName,
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
        const product = new Product_1.Product(productData);
        await product.save();
        res.json({ message: 'Product URL submitted successfully', name: productData.name, price, image, inStock, stockStatus });
    }
    catch (err) {
        console.error('Failed to save product URL:', err);
        res.status(500).json({ error: 'Failed to save product URL' });
    }
});
app.post('/api/check-price', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    try {
        const { price, image, inStock, stockStatus } = await (0, scraper_1.scrapeProductDetails)(url);
        if (price === 'CAPTCHA') {
            return res.status(400).json({ error: 'CAPTCHA Required. Please add manually.' });
        }
        if (price === null) {
            return res.status(400).json({ error: 'Price not found. Please add manually.' });
        }
        if (typeof price !== 'number') {
            return res.status(400).json({ error: 'Unexpected error: price is not a number.' });
        }
        const updateData = { price, lastChecked: new Date() };
        if (inStock !== undefined && stockStatus) {
            updateData.inStock = inStock;
            updateData.stockStatus = stockStatus;
            updateData.lastStockChecked = new Date();
        }
        const product = await Product_1.Product.findOneAndUpdate({ url }, updateData, { new: true });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Price updated successfully', product });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to check price' });
    }
});
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product_1.Product.find().populate('folderId').sort({ createdAt: -1 });
        res.json(products);
    }
    catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Product_1.Product.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted' });
    }
    catch (err) {
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
        const manualProductData = { name, url, price, image, folderId };
        if (inStock !== undefined) {
            manualProductData.inStock = inStock;
        }
        if (stockStatus) {
            manualProductData.stockStatus = stockStatus;
        }
        if (lastStockChecked) {
            manualProductData.lastStockChecked = new Date(lastStockChecked);
        }
        const manualProduct = new ManualProduct_1.ManualProduct(manualProductData);
        await manualProduct.save();
        res.json({ message: 'Manual product added', manualProduct });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to add manual product' });
    }
});
app.get('/api/manual-products', async (req, res) => {
    try {
        const manualProducts = await ManualProduct_1.ManualProduct.find().populate('folderId').sort({ createdAt: -1 });
        res.json(manualProducts);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch manual products' });
    }
});
app.delete('/api/manual-products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await ManualProduct_1.ManualProduct.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Manual product not found' });
        }
        res.json({ message: 'Manual product deleted' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete manual product' });
    }
});
// Folder API endpoints
app.post('/api/folders', async (req, res) => {
    const { name, description, color } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Folder name is required' });
    }
    try {
        const folder = new Folder_1.Folder({ name, description, color });
        await folder.save();
        res.json({ message: 'Folder created successfully', folder });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create folder' });
    }
});
app.get('/api/folders', async (req, res) => {
    try {
        const folders = await Folder_1.Folder.find().sort({ createdAt: -1 });
        res.json(folders);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch folders' });
    }
});
app.put('/api/folders/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, color } = req.body;
    try {
        const folder = await Folder_1.Folder.findByIdAndUpdate(id, { name, description, color, updatedAt: new Date() }, { new: true });
        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }
        res.json({ message: 'Folder updated successfully', folder });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update folder' });
    }
});
app.delete('/api/folders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Remove folder reference from all products
        await Product_1.Product.updateMany({ folderId: id }, { folderId: null });
        await ManualProduct_1.ManualProduct.updateMany({ folderId: id }, { folderId: null });
        const deleted = await Folder_1.Folder.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Folder not found' });
        }
        res.json({ message: 'Folder deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});
// Add endpoint to move products to folders
app.post('/api/products/:id/move', async (req, res) => {
    const { id } = req.params;
    const { folderId } = req.body;
    try {
        const product = await Product_1.Product.findByIdAndUpdate(id, { folderId }, { new: true });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product moved to folder successfully', product });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to move product to folder' });
    }
});
app.post('/api/manual-products/:id/move', async (req, res) => {
    const { id } = req.params;
    const { folderId } = req.body;
    try {
        const manualProduct = await ManualProduct_1.ManualProduct.findByIdAndUpdate(id, { folderId }, { new: true });
        if (!manualProduct) {
            return res.status(404).json({ error: 'Manual product not found' });
        }
        res.json({ message: 'Manual product moved to folder successfully', manualProduct });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to move manual product to folder' });
    }
});
// Schedule a cron job to update all tracked product prices and stock status at 5am EST daily
node_cron_1.default.schedule('0 10 * * *', async () => {
    console.log('Running daily price and stock update for all tracked products...');
    try {
        const products = await Product_1.Product.find();
        for (const product of products) {
            try {
                const { price, inStock, stockStatus } = await (0, scraper_1.scrapeProductDetails)(product.url);
                let updated = false;
                // Update price if changed
                if (typeof price === 'number' && price !== product.price) {
                    product.price = price;
                    product.lastChecked = new Date();
                    updated = true;
                    console.log(`Updated price for ${product.name || product.url}: $${price}`);
                }
                else if (typeof price === 'number') {
                    product.lastChecked = new Date();
                    console.log(`Checked price for ${product.name || product.url}: $${price} (no change)`);
                }
                else if (price !== null) {
                    console.log(`Failed to update price for ${product.name || product.url}: ${price}`);
                }
                else {
                    console.log(`Failed to update price for ${product.name || product.url}`);
                }
                // Update stock status if available
                if (inStock !== undefined && stockStatus) {
                    product.inStock = inStock;
                    product.stockStatus = stockStatus;
                    product.lastStockChecked = new Date();
                    updated = true;
                    console.log(`Updated stock status for ${product.name || product.url}: ${stockStatus} (inStock: ${inStock})`);
                }
                if (updated) {
                    await product.save();
                }
            }
            catch (err) {
                console.error(`Error updating ${product.name || product.url}:`, err);
            }
        }
    }
    catch (err) {
        console.error('Error running daily price and stock update:', err);
    }
});
app.post('/api/check-stock', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    try {
        const { inStock, stockStatus } = await (0, scraper_1.scrapeProductDetails)(url);
        if (inStock === undefined || !stockStatus) {
            return res.status(400).json({ error: 'Failed to check stock status' });
        }
        const product = await Product_1.Product.findOneAndUpdate({ url }, {
            inStock,
            stockStatus,
            lastStockChecked: new Date()
        }, { new: true });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Stock status updated successfully', product });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to check stock status' });
    }
});
app.post('/api/check-stock-manual', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    try {
        const { inStock, stockStatus } = await (0, scraper_1.scrapeProductDetails)(url);
        if (inStock === undefined || !stockStatus) {
            return res.status(400).json({ error: 'Failed to check stock status' });
        }
        const manualProduct = await ManualProduct_1.ManualProduct.findOneAndUpdate({ url }, {
            inStock,
            stockStatus,
            lastStockChecked: new Date()
        }, { new: true });
        if (!manualProduct) {
            return res.status(404).json({ error: 'Manual product not found' });
        }
        res.json({ message: 'Stock status updated successfully', manualProduct });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to check stock status' });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
