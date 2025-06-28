"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeProductDetails = scrapeProductDetails;
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Playwright for advanced anti-bot evasion
// Usage: call scrapeWithPlaywright(url) instead of Puppeteer for Walmart or other hard targets
const playwright_1 = require("playwright");
puppeteer.use(StealthPlugin());
// Common price selectors for different e-commerce sites
const PRICE_SELECTORS = {
    // H&M
    'hm.com': '.price__value, [data-price], .product-item-price, .price, .price__current, .price__current-value',
    // Amazon (expanded selectors)
    'amazon.com': '#priceblock_dealprice, #priceblock_saleprice, #priceblock_ourprice, .a-price .a-offscreen, span.a-price .a-offscreen, span.a-price-whole, span.a-price-fraction',
    // Apple
    'apple.com': '.as-price-currentprice, .rf-pdp-price-current, [data-autom="current-price"], .current_price',
    // Walmart
    'walmart.com': '.price-characteristic, [data-automation-id="product-price"]',
    // Target
    'target.com': '[data-test="product-price"], .h-text-bs',
    // Samsung
    'samsung.com': 'div[data-testid="product-detail-price"], .product-detail-price, .price',
    // Generic fallback selectors
    'default': '.price, .product-price, [data-price], .current-price'
};
// Common stock status selectors for different e-commerce sites
const STOCK_SELECTORS = {
    // Amazon
    'amazon.com': {
        inStock: [
            '#availability .a-color-success',
            '#availability .a-color-state',
            '#availability span:contains("In Stock")',
            '#availability span:contains("in stock")',
            '#add-to-cart-button',
            '#buy-now-button'
        ],
        outOfStock: [
            '#availability .a-color-price',
            '#availability span:contains("Out of Stock")',
            '#availability span:contains("out of stock")',
            '#availability span:contains("Currently unavailable")',
            '#availability span:contains("Temporarily out of stock")'
        ]
    },
    // H&M
    'hm.com': {
        inStock: [
            '.product-item-stock .in-stock',
            '.product-item-stock .available',
            'button[data-testid="add-to-bag"]',
            '.add-to-cart-button'
        ],
        outOfStock: [
            '.product-item-stock .out-of-stock',
            '.product-item-stock .unavailable',
            'button[data-testid="notify-me"]',
            '.notify-me-button'
        ]
    },
    // Walmart
    'walmart.com': {
        inStock: [
            '[data-testid="add-to-cart-button"]',
            '.add-to-cart-button',
            '.product-availability .in-stock'
        ],
        outOfStock: [
            '[data-testid="notify-me-button"]',
            '.notify-me-button',
            '.product-availability .out-of-stock'
        ]
    },
    // Target
    'target.com': {
        inStock: [
            '[data-test="addToCartButton"]',
            '.add-to-cart-button',
            '.product-availability .in-stock'
        ],
        outOfStock: [
            '[data-test="notifyMeButton"]',
            '.notify-me-button',
            '.product-availability .out-of-stock'
        ]
    },
    // Samsung
    'samsung.com': {
        inStock: [
            'button[data-testid="ctaButton"]',
            'button:contains("Continue")',
            '.cta-button',
            '.buy-now',
        ],
        outOfStock: [
            'button:contains("Out of Stock")',
            '.out-of-stock',
            '.unavailable',
            '.sold-out'
        ]
    },
    // Generic fallback
    'default': {
        inStock: [
            'button:contains("Add to Cart")',
            'button:contains("Buy Now")',
            '.add-to-cart',
            '.buy-now',
            '.in-stock',
            '.available'
        ],
        outOfStock: [
            'button:contains("Notify Me")',
            'button:contains("Out of Stock")',
            '.out-of-stock',
            '.unavailable',
            '.sold-out'
        ]
    }
};
// --- SITE-SPECIFIC PRICE EXTRACTORS ---
// To add a new site-specific price extractor:
// 1. Create a new function like: async function extractNewSitePrice(page: any): Promise<number | string | null>
// 2. Add it to the strategies array in masterExtractPrice() below
// 3. The master scraper will try it for ALL sites, not just the specific site
async function extractAmazonPrice(page) {
    return await page.evaluate(() => {
        // 1. Try .a-price .a-offscreen inside #corePriceDisplay_desktop_feature_div
        const priceEl = document.querySelector('#corePriceDisplay_desktop_feature_div .a-price .a-offscreen');
        if (priceEl && priceEl.textContent)
            return priceEl.textContent.trim();
        // 2. Try #priceblock_ourprice, #priceblock_dealprice, #priceblock_saleprice
        const el = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, #priceblock_saleprice');
        if (el && el.textContent)
            return el.textContent.trim();
        // 3. Try combining .a-price-whole and .a-price-fraction
        const whole = document.querySelector('.a-price-whole');
        const fraction = document.querySelector('.a-price-fraction');
        if (whole && fraction) {
            return `${whole.textContent?.replace(/[^0-9]/g, '')}.${fraction.textContent?.replace(/[^0-9]/g, '')}`;
        }
        // 4. Fallback: first .a-offscreen anywhere
        const offscreen = document.querySelector('.a-offscreen');
        if (offscreen && offscreen.textContent)
            return offscreen.textContent.trim();
        return null;
    });
}
async function extractEbayPrice(page) {
    return await page.evaluate(() => {
        const allTextspans = Array.from(document.querySelectorAll('.ux-textspans')).map(el => el.textContent?.trim() || '');
        for (const text of allTextspans) {
            if (text && text.match(/\$[0-9,.]+/))
                return text;
        }
        return null;
    });
}
async function extractPlayStationPrice(page) {
    return await page.evaluate(() => {
        // Try meta[itemprop="price"]
        const structuredPrice = document.querySelector('meta[itemprop="price"]');
        if (structuredPrice && structuredPrice.getAttribute('content')) {
            return structuredPrice.getAttribute('content');
        }
        // Try price block
        const priceContainer = document.querySelector('.price-text.js-actual-price');
        if (priceContainer) {
            const symbol = priceContainer.querySelector('.js-actual-price-symbol');
            const whole = priceContainer.querySelector('.js-actual-price-whole');
            const fraction = priceContainer.querySelector('.js-actual-price-fraction');
            if (symbol && whole && fraction) {
                return (symbol.textContent ?? '') + (whole.textContent ?? '') + '.' + (fraction.textContent ?? '');
            }
        }
        return null;
    });
}
// --- SITE-SPECIFIC IMAGE EXTRACTORS ---
async function extractAmazonImage(page) {
    return await page.evaluate(() => {
        const og = document.querySelector('meta[property="og:image"]');
        if (og && og.getAttribute('content'))
            return og.getAttribute('content');
        const img = document.querySelector('#imgTagWrapperId img');
        if (img && img.src)
            return img.src;
        const fallback = document.querySelector('img');
        if (fallback && fallback.src)
            return fallback.src;
        return null;
    });
}
async function extractEbayImage(page) {
    return await page.evaluate(() => {
        const og = document.querySelector('meta[property="og:image"]');
        if (og && og.getAttribute('content'))
            return og.getAttribute('content');
        const icImg = document.querySelector('img#icImg');
        if (icImg && icImg.src)
            return icImg.src;
        const mainImg = document.querySelector('img[aria-hidden="false"]');
        if (mainImg && mainImg.src)
            return mainImg.src;
        const img = document.querySelector('img');
        if (img && img.src)
            return img.src;
        return null;
    });
}
async function extractPlayStationImage(page) {
    return await page.evaluate(() => {
        const structuredImg = document.querySelector('img[itemprop="image"]');
        if (structuredImg && structuredImg.src) {
            return structuredImg.src;
        }
        const heroImgs = Array.from(document.querySelectorAll('img.hero-banner.background'));
        for (const img of heroImgs) {
            const alt = img.getAttribute('alt');
            if (alt && alt.includes('PS5') && img.src) {
                return img.src;
            }
        }
        return null;
    });
}
// --- SITE-SPECIFIC STOCK EXTRACTORS ---
async function extractAmazonStock(page) {
    return await page.evaluate(() => {
        const avail = document.querySelector('#availability .a-color-success, #availability .a-color-state');
        if (avail && avail.textContent && avail.textContent.toLowerCase().includes('in stock')) {
            return { inStock: true, stockStatus: 'In Stock' };
        }
        const out = document.querySelector('#availability .a-color-price');
        if (out && out.textContent && (out.textContent.toLowerCase().includes('out of stock') || out.textContent.toLowerCase().includes('unavailable'))) {
            return { inStock: false, stockStatus: 'Out of Stock' };
        }
        return { inStock: null, stockStatus: 'Unknown' };
    });
}
async function extractEbayStock(page) {
    return await page.evaluate(() => {
        const buyNow = document.querySelector('button[aria-label*="Buy It Now" i], button[aria-label*="Add to cart" i], button[title*="Buy It Now" i], button[title*="Add to cart" i], button.btn.btn--primary');
        if (buyNow)
            return { inStock: true, stockStatus: 'In Stock' };
        const ended = document.body.innerText.match(/This listing was ended|sold|out of stock/i);
        if (ended)
            return { inStock: false, stockStatus: 'Out of Stock' };
        return { inStock: null, stockStatus: 'Unknown' };
    });
}
async function extractPlayStationStock(page) {
    return await page.evaluate(() => {
        const avail = document.querySelector('link[itemprop="availability"]')?.getAttribute('href');
        if (avail) {
            if (avail.toLowerCase().includes('instock'))
                return { inStock: true, stockStatus: 'In Stock' };
            if (avail.toLowerCase().includes('outofstock'))
                return { inStock: false, stockStatus: 'Out of Stock' };
        }
        const btn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent && btn.textContent.toLowerCase().includes('add to cart'));
        if (btn)
            return { inStock: true, stockStatus: 'In Stock' };
        const outBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent && btn.textContent.toLowerCase().includes('out of stock'));
        if (outBtn)
            return { inStock: false, stockStatus: 'Out of Stock' };
        return { inStock: null, stockStatus: 'Unknown' };
    });
}
// --- SEPHORA-SPECIFIC EXTRACTORS ---
async function extractSephoraPrice(page) {
    return await page.evaluate(() => {
        console.log('[DEBUG] Running Sephora price extraction...');
        // 1. Look for price in <b> or <span> elements with css-0 class (found in HTML)
        const priceElements = Array.from(document.querySelectorAll('b.css-0, span.css-0'));
        console.log('[DEBUG] Found css-0 price elements:', priceElements.length);
        for (const el of priceElements) {
            if (!el.textContent)
                continue;
            const text = el.textContent.trim();
            console.log('[DEBUG] Checking css-0 element text:', text);
            const match = text.match(/\$\d+[\.,]?\d*/);
            if (match) {
                console.log('[DEBUG] Found price in css-0 element:', match[0]);
                return match[0];
            }
        }
        // 2. Look for price in JSON data (found in HTML)
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
            if (!script.textContent)
                continue;
            const text = script.textContent;
            if (text.includes('"listPrice"')) {
                const match = text.match(/"listPrice":"([^"]+)"/);
                if (match && match[1]) {
                    console.log('[DEBUG] Found price in JSON data:', match[1]);
                    return match[1];
                }
            }
        }
        // 3. Look for price near Add to Basket button
        const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && /add to basket/i.test(el.textContent));
        console.log('[DEBUG] Found Add to Basket button:', !!btn);
        if (btn) {
            let container = btn.closest('div, section, form');
            while (container) {
                const priceMatch = container.textContent?.match(/\$\d+[\.,]?\d*/g);
                if (priceMatch && priceMatch.length > 0) {
                    // Filter out payment plan prices
                    const filtered = priceMatch.filter(p => !/\d+\s*payments|klarna|afterpay|paypal|off|save|payment/i.test(container?.textContent || ''));
                    if (filtered.length > 0) {
                        console.log('[DEBUG] Found price near button:', filtered[filtered.length - 1]);
                        return filtered[filtered.length - 1];
                    }
                }
                container = container.parentElement;
            }
        }
        console.log('[DEBUG] No Sephora price found');
        return null;
    });
}
async function extractSephoraImage(page) {
    return await page.evaluate(() => {
        console.log('[DEBUG] Running Sephora image extraction...');
        // 1. Look for main product image in srcset (found in HTML)
        const imgs = Array.from(document.querySelectorAll('img[srcset*="main-zoom.jpg"]'));
        console.log('[DEBUG] Found main-zoom images:', imgs.length);
        for (const img of imgs) {
            const image = img;
            if (image.src && image.src.includes('main-zoom.jpg')) {
                console.log('[DEBUG] Found main-zoom image:', image.src);
                return image.src;
            }
        }
        // 2. Look for productimages URLs in any img src
        const productImgs = Array.from(document.querySelectorAll('img[src*="productimages/sku/"]'));
        console.log('[DEBUG] Found productimages:', productImgs.length);
        for (const img of productImgs) {
            const image = img;
            if (image.src && image.src.includes('main-zoom.jpg')) {
                console.log('[DEBUG] Found main product image:', image.src);
                return image.src;
            }
        }
        // 3. Fallback: first large image
        const largeImgs = Array.from(document.images).filter(img => img.width > 200 && img.height > 200);
        console.log('[DEBUG] Found large images:', largeImgs.length);
        if (largeImgs.length > 0) {
            largeImgs.sort((a, b) => (b.width * b.height) - (a.width * a.height));
            console.log('[DEBUG] Selected largest image:', largeImgs[0].src);
            return largeImgs[0].src;
        }
        console.log('[DEBUG] No Sephora image found');
        return null;
    });
}
async function extractSephoraStock(page) {
    return await page.evaluate(() => {
        // If Add to Basket button is visible and enabled, it's in stock
        const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && /add to basket/i.test(el.textContent));
        if (btn && !btn.disabled && btn.offsetParent !== null)
            return { inStock: true, stockStatus: 'In Stock' };
        if (btn && (btn.disabled || btn.offsetParent === null))
            return { inStock: false, stockStatus: 'Out of Stock' };
        return { inStock: null, stockStatus: 'Unknown' };
    });
}
// --- END SEPHORA-SPECIFIC EXTRACTORS ---
// --- MASTER SCRAPER HELPERS ---
// These functions try multiple strategies in order until one succeeds.
// To add new strategies:
// 1. Create a new extractor function (see examples above)
// 2. Add it to the strategies array below
// 3. The master scraper will try ALL strategies for EVERY site
async function masterExtractPrice(page) {
    const strategies = [
        // Generic strategies (try these first)
        async () => await page.evaluate(() => {
            let price = document.querySelector('meta[itemprop="price"]')?.getAttribute('content');
            if (price)
                return price;
            price = document.querySelector('meta[property="product:price:amount"]')?.getAttribute('content')
                || document.querySelector('meta[property="og:price:amount"]')?.getAttribute('content');
            if (price)
                return price;
            const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
            for (const script of scripts) {
                try {
                    const text = script.textContent;
                    if (!text)
                        continue;
                    const data = JSON.parse(text);
                    if (data && data.offers && data.offers.price)
                        return data.offers.price;
                    if (Array.isArray(data)) {
                        for (const obj of data) {
                            if (obj && obj.offers && obj.offers.price)
                                return obj.offers.price;
                        }
                    }
                }
                catch { }
            }
            const el = document.querySelector('.price, .product-price, [data-price], .current-price, [class*="price"], [id*="price"]');
            if (el && el.textContent)
                return el.textContent.trim();
            return null;
        }),
        // Site-specific strategies (add new ones here)
        () => extractAmazonPrice(page),
        () => extractEbayPrice(page),
        () => extractPlayStationPrice(page),
        // Sephora-specific strategy (moved up to prioritize over generic fallbacks)
        () => extractSephoraPrice(page),
        // TODO: Add new strategies here:
        // () => extractBestBuyPrice(page),
        // () => extractTargetPrice(page),
        // () => extractWalmartPrice(page),
        // Price near Add to Cart button
        async () => await page.evaluate(() => {
            // Try to find a button with add to cart or similar text
            const btn = Array.from(document.querySelectorAll('button, input[type="submit"]')).find(el => el.textContent && /add to cart|sign in to add to cart|buy now/i.test(el.textContent));
            if (btn) {
                // Look for price in the same container or parent
                let container = btn.closest('div, section, form');
                while (container) {
                    // Look for price pattern in text nodes
                    const priceMatch = container.textContent?.match(/\$\d+[\.,]?\d*/g);
                    if (priceMatch && priceMatch.length > 0) {
                        // Return the price closest to the button (last in the text)
                        return priceMatch[priceMatch.length - 1];
                    }
                    container = container.parentElement;
                }
            }
            return null;
        }),
        // Regex fallback: find the largest price on the page
        async () => await page.evaluate(() => {
            const matches = Array.from(document.body.innerText.matchAll(/\$\d+[\.,]?\d*/g)).map(m => m[0]);
            if (matches.length === 0)
                return null;
            // Convert to numbers and find the largest
            const prices = matches.map(str => parseFloat(str.replace(/[^\d.]/g, ''))).filter(n => !isNaN(n));
            if (prices.length === 0)
                return null;
            const max = Math.max(...prices);
            // Return the price string that matches the max value
            const best = matches.find(str => parseFloat(str.replace(/[^\d.]/g, '')) === max);
            return best || null;
        })
    ];
    for (const strategy of strategies) {
        const result = await strategy();
        if (result)
            return result;
    }
    return null;
}
async function masterExtractImage(page) {
    const strategies = [
        // Generic strategies (try these first)
        async () => await page.evaluate(() => {
            let img = document.querySelector('meta[property="og:image"]')?.getAttribute('content')
                || document.querySelector('meta[itemprop="image"]')?.getAttribute('content');
            if (img)
                return img;
            const mainImg = document.querySelector('.product-image, .main-image, img[alt*="product" i], img[alt*="main" i]');
            if (mainImg && mainImg.src)
                return mainImg.src;
            const imgs = Array.from(document.images).filter(img => img.width > 100 && img.height > 100);
            if (imgs.length > 0) {
                imgs.sort((a, b) => (b.width * b.height) - (a.width * a.height));
                return imgs[0].src;
            }
            const allImgs = Array.from(document.images);
            for (const img of allImgs) {
                const alt = img.alt || '';
                const src = img.src || '';
                if (!alt.toLowerCase().includes('logo') && !src.toLowerCase().includes('logo')) {
                    return src;
                }
            }
            return null;
        }),
        // Site-specific strategies (add new ones here)
        () => extractAmazonImage(page),
        () => extractEbayImage(page),
        () => extractPlayStationImage(page),
        // Sephora-specific strategy (moved up to prioritize over generic fallbacks)
        () => extractSephoraImage(page),
        // TODO: Add new strategies here:
        // () => extractBestBuyImage(page),
        // () => extractTargetImage(page),
        // () => extractWalmartImage(page)
    ];
    for (const strategy of strategies) {
        const result = await strategy();
        if (result)
            return result;
    }
    return null;
}
async function masterExtractStock(page) {
    const strategies = [
        // Generic strategies (try these first)
        async () => await page.evaluate(() => {
            const avail = document.querySelector('link[itemprop="availability"]')?.getAttribute('href');
            if (avail) {
                if (avail.toLowerCase().includes('instock'))
                    return { inStock: true, stockStatus: 'In Stock' };
                if (avail.toLowerCase().includes('outofstock'))
                    return { inStock: false, stockStatus: 'Out of Stock' };
            }
            const btns = Array.from(document.querySelectorAll('button, input[type="submit"]'));
            for (const btn of btns) {
                const text = btn.textContent?.toLowerCase() || '';
                if (text.includes('add to cart') || text.includes('buy now'))
                    return { inStock: true, stockStatus: 'In Stock' };
                if (text.includes('out of stock') || text.includes('sold out') || text.includes('unavailable'))
                    return { inStock: false, stockStatus: 'Out of Stock' };
            }
            const inStockEl = document.querySelector('.in-stock, .available');
            if (inStockEl)
                return { inStock: true, stockStatus: 'In Stock' };
            const outStockEl = document.querySelector('.out-of-stock, .unavailable, .sold-out');
            if (outStockEl)
                return { inStock: false, stockStatus: 'Out of Stock' };
            const bodyText = document.body.innerText.toLowerCase();
            if (bodyText.includes('in stock'))
                return { inStock: true, stockStatus: 'In Stock' };
            if (bodyText.includes('out of stock') || bodyText.includes('sold out') || bodyText.includes('unavailable'))
                return { inStock: false, stockStatus: 'Out of Stock' };
            return { inStock: null, stockStatus: 'Unknown' };
        }),
        // Site-specific strategies (add new ones here)
        () => extractAmazonStock(page),
        () => extractEbayStock(page),
        () => extractPlayStationStock(page),
        // TODO: Add new strategies here:
        // () => extractBestBuyStock(page),
        // () => extractTargetStock(page),
        // () => extractWalmartStock(page),
        // Sephora-specific strategy
        () => extractSephoraStock(page)
    ];
    for (const strategy of strategies) {
        const result = await strategy();
        if (result && result.inStock !== null)
            return result;
    }
    return { inStock: null, stockStatus: 'Unknown' };
}
// --- END MASTER SCRAPER HELPERS ---
/**
 * Scrape product details (price, image, stock) in one go for any site.
 * Uses Playwright for Walmart, Puppeteer for others.
 * Returns { price, image, inStock, stockStatus }
 */
async function scrapeProductDetails(url) {
    const domain = new URL(url).hostname;
    const isWalmart = domain.includes('walmart.com');
    const scrapeId = Date.now();
    let browser;
    let page;
    let price = null;
    let image = null;
    let inStock = null;
    let stockStatus = 'Unknown';
    let screenshotPath = path_1.default.resolve(__dirname, `../../../debug-screenshot-details-${scrapeId}.png`);
    if (isWalmart) {
        // --- Playwright for Walmart ---
        browser = await playwright_1.chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            viewport: { width: 1280, height: 800 },
            extraHTTPHeaders: { 'accept-language': 'en-US,en;q=0.9' },
        });
        page = await context.newPage();
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(3000);
            await page.screenshot({ path: screenshotPath });
            // --- Price ---
            price = await page.evaluate(() => {
                const buyBox = document.querySelector('[data-automation-id="product-price"]');
                if (buyBox && buyBox.textContent)
                    return buyBox.textContent.trim();
                const addToCart = document.querySelector('button[data-testid="add-to-cart-button"], button.prod-ProductCTA--primary');
                if (addToCart) {
                    let el = addToCart.parentElement;
                    for (let i = 0; i < 5 && el; i++, el = el.parentElement) {
                        if (!el)
                            continue;
                        const priceSpan = el.querySelector('span, div');
                        if (priceSpan && priceSpan.textContent && priceSpan.textContent.trim().match(/^$/)) {
                            return priceSpan.textContent.trim();
                        }
                    }
                }
                const spans = Array.from(document.querySelectorAll('span, div')).filter(el => {
                    if (!el || !el.textContent)
                        return false;
                    const style = window.getComputedStyle(el);
                    return el.textContent.trim().match(/^$/) && style.display !== 'none' && style.visibility !== 'hidden' && (el instanceof HTMLElement ? el.offsetParent !== null : true);
                });
                if (spans.length > 0 && spans[0] && spans[0].textContent)
                    return spans[0].textContent.trim();
                return null;
            });
            if (price) {
                const cleaned = price.replace(/\s|\u00A0/g, '');
                const match = cleaned.match(/\d+[.,]?\d*/);
                price = match ? parseFloat(match[0].replace(/,/g, '')) : null;
            }
            // --- Image ---
            image = await page.evaluate(() => {
                const img = document.querySelector('img[data-testid="product-image"]') || document.querySelector('img.prod-hero-image-image') || document.querySelector('img');
                if (img && img.src)
                    return img.src;
                const og = document.querySelector('meta[property="og:image"]');
                if (og && og.getAttribute('content'))
                    return og.getAttribute('content');
                return null;
            });
            // --- Stock ---
            const inStockSelectors = [
                '[data-testid="add-to-cart-button"]',
                '.add-to-cart-button',
                '.product-availability .in-stock'
            ];
            const outOfStockSelectors = [
                '[data-testid="notify-me-button"]',
                '.notify-me-button',
                '.product-availability .out-of-stock'
            ];
            let inStockFound = false;
            let outOfStockFound = false;
            for (const selector of inStockSelectors) {
                if (await page.$(selector)) {
                    inStockFound = true;
                    break;
                }
            }
            for (const selector of outOfStockSelectors) {
                if (await page.$(selector)) {
                    outOfStockFound = true;
                    break;
                }
            }
            if (inStockFound && !outOfStockFound) {
                inStock = true;
                stockStatus = 'In Stock';
            }
            else if (outOfStockFound && !inStockFound) {
                inStock = false;
                stockStatus = 'Out of Stock';
            }
            else if (!outOfStockFound) {
                // Rule: if not out of stock, must be in stock
                inStock = true;
                stockStatus = 'In Stock';
            }
        }
        catch (err) {
            console.error('Error in scrapeProductDetails (Playwright):', err);
        }
        finally {
            await browser.close();
        }
    }
    else {
        // --- Puppeteer for all other sites ---
        browser = await puppeteer.launch({
            headless: true, // Back to headless mode
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
            ],
            executablePath: process.env.CHROME_PATH || undefined,
        });
        page = await browser.newPage();
        // Set a real user-agent and extra headers for anti-bot evasion
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'accept-language': 'en-US,en;q=0.9',
            'upgrade-insecure-requests': '1',
        });
        try {
            await page.setViewport({ width: 1280, height: 800 });
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            let walgreensHtmlPath;
            let walgreensScreenshotPath;
            try {
                if (domain.includes('walgreens.com')) {
                    // Wait a fixed 15 seconds for Walgreens content to load
                    await new Promise(resolve => setTimeout(resolve, 15000));
                }
                else {
                    await new Promise(resolve => setTimeout(resolve, 8000));
                }
            }
            catch (err) {
                // Continue to finally for debug
            }
            finally {
                if (domain.includes('walgreens.com')) {
                    walgreensHtmlPath = path_1.default.resolve(__dirname, `../../../debug-walgreens-html-${scrapeId}.html`);
                    walgreensScreenshotPath = path_1.default.resolve(__dirname, `../../../debug-walgreens-screenshot-${scrapeId}.png`);
                    const html = await page.content();
                    fs_1.default.writeFileSync(walgreensHtmlPath, html, 'utf-8');
                    await page.screenshot({ path: walgreensScreenshotPath });
                }
            }
            // --- Even more robust popup/modal close logic ---
            try {
                const closeSelectors = [
                    // Quiz modal close buttons (the actual popup)
                    '#ecap-quiz-close',
                    '.ModalScreens_dismiss__OTWWa',
                    '.Pod5Quiz_close_button__LAaGS',
                    // Original exit intent modal (backup)
                    '#close-exit-intent-modal-button',
                    'button[aria-label="Close"]',
                    'button[aria-label="close"]',
                    'button[title="Close"]',
                    'button[title="close"]',
                    '.close',
                    '.modal-close',
                    '.popup-close',
                    '.close-button',
                    '.modal__close',
                    '.Dialog-close',
                    'button[aria-label*="close" i]',
                    'button[title*="close" i]',
                    'button[aria-label*="dismiss" i]',
                    'button[title*="dismiss" i]',
                    'button[aria-label*="exit" i]',
                    'button[title*="exit" i]',
                    'button[aria-label*="skip" i]',
                    'button[title*="skip" i]',
                    'button:contains("Skip")',
                    'button:contains("skip")',
                    'button:contains("Close")',
                    'button:contains("close")',
                    'button:contains("×")',
                    'button:contains("X")',
                    'button:contains("x")'
                ];
                let closed = false;
                for (const selector of closeSelectors) {
                    const closeBtns = await page.$$(selector);
                    for (const closeBtn of closeBtns) {
                        const box = await closeBtn.boundingBox();
                        if (box) {
                            await closeBtn.evaluate((el) => el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' }));
                            await closeBtn.click({ force: true }).catch(() => { });
                            await page.evaluate((el) => el.click(), closeBtn);
                            await page.waitForTimeout(1000);
                            const stillAttached = await closeBtn.isConnected ? await page.evaluate((el) => document.body.contains(el), closeBtn) : false;
                            if (!stillAttached) {
                                closed = true;
                                break;
                            }
                        }
                    }
                    if (closed)
                        break;
                }
                if (!closed) {
                    const skipLinks = await page.$$('a,button');
                    for (const skip of skipLinks) {
                        const text = await page.evaluate((el) => el.textContent, skip);
                        if (text && text.trim().toLowerCase() === 'skip') {
                            await skip.evaluate((el) => el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' }));
                            await skip.click({ force: true }).catch(() => { });
                            await page.evaluate((el) => el.click(), skip);
                            await page.waitForTimeout(1000);
                            break;
                        }
                    }
                }
                // --- Aggressive overlay removal and force-close logic ---
                // Remove overlays that might block the click
                await page.evaluate(() => {
                    Array.from(document.querySelectorAll('div,section')).forEach(el => {
                        const style = window.getComputedStyle(el);
                        const htmlEl = el;
                        if ((style.position === 'fixed' || style.position === 'absolute') &&
                            (parseInt(style.zIndex) > 1000 || style.zIndex === 'auto') &&
                            (htmlEl.offsetWidth > window.innerWidth * 0.8 && htmlEl.offsetHeight > window.innerHeight * 0.8)) {
                            htmlEl.style.display = 'none';
                        }
                    });
                });
                // Force the close button to be visible and clickable
                await page.evaluate(() => {
                    const btn = document.getElementById('close-exit-intent-modal-button');
                    if (btn) {
                        btn.style.display = 'block';
                        btn.style.opacity = '1';
                        btn.style.pointerEvents = 'auto';
                        let el = btn.parentElement;
                        while (el) {
                            el.style.display = 'block';
                            el.style.opacity = '1';
                            el.style.pointerEvents = 'auto';
                            el = el.parentElement;
                        }
                    }
                });
                // Try clicking the button again
                const closeBtn = await page.$('#close-exit-intent-modal-button');
                if (closeBtn) {
                    await closeBtn.click({ force: true }).catch(() => { });
                    await page.evaluate((el) => el.click(), closeBtn);
                    await page.waitForTimeout(1000);
                }
                // Last resort: remove the entire popup from DOM
                if (!closed) {
                    await page.evaluate(() => {
                        // Remove quiz modal containers
                        const quizModals = document.querySelectorAll('.Pod5Quiz_modal_wrapper_content__aZJsZ, .QuizModal_modal_container__TESt8, .ModalScreens_ecap_content_wrapper__xmcQF');
                        quizModals.forEach(el => el.remove());
                        // Remove any remaining modal overlays
                        const overlays = document.querySelectorAll('div[style*="position: fixed"], div[style*="position:fixed"]');
                        overlays.forEach(el => {
                            const style = window.getComputedStyle(el);
                            if (style.position === 'fixed' && (parseInt(style.zIndex) > 1000 || style.zIndex === 'auto')) {
                                el.remove();
                            }
                        });
                    });
                }
            }
            catch (e) {
                // Ignore if not found
            }
            // Always save the full HTML for debugging
            const html = await page.content();
            fs_1.default.writeFileSync('debug-popup-fail.html', html, 'utf-8');
            // Debug HTML capture for Sephora pages
            if (domain.includes('sephora.com')) {
                const sephoraHtmlPath = path_1.default.resolve(__dirname, `../../../debug-sephora-html-${scrapeId}.html`);
                fs_1.default.writeFileSync(sephoraHtmlPath, html, 'utf-8');
                console.log(`[DEBUG] Sephora HTML saved to: ${sephoraHtmlPath}`);
            }
            // --- eBay-specific wait for price element ---
            if (domain.includes('ebay.com')) {
                await page.waitForFunction(() => {
                    const els = Array.from(document.querySelectorAll('.ux-textspans'));
                    return els.some(el => el.textContent && /\$[0-9,.]+/.test(el.textContent));
                }, { timeout: 20000 });
            }
            await page.screenshot({ path: screenshotPath });
            // --- MASTER SCRAPER FIRST ---
            price = await masterExtractPrice(page);
            if (price) {
                const cleaned = (typeof price === 'string' ? price : String(price)).replace(/\s|\u00A0/g, '');
                const match = cleaned.match(/\d+[.,]?\d*/);
                price = match ? parseFloat(match[0].replace(/,/g, '')) : null;
            }
            image = await masterExtractImage(page);
            const stockResult = await masterExtractStock(page);
            inStock = stockResult.inStock;
            stockStatus = stockResult.stockStatus;
            // --- Site-specific logic only if master failed ---
            if (!price || !image || inStock === null) {
                // ... existing site-specific logic for Amazon, Apple, eBay, etc. ...
            }
        }
        catch (err) {
            console.error('Error in scrapeProductDetails (Puppeteer):', err);
        }
        finally {
            await browser.close();
        }
    }
    return { price, image, inStock, stockStatus };
}
// Helper functions for type safety
async function waitForAnyButton(page, selector) {
    // ... existing code ...
}
async function clickAllButtons(page, sel) {
    // ... existing code ...
}
async function waitForPriceElement(page, selector) {
    // ... existing code ...
}
async function waitForStockElement(page, sel) {
    // ... existing code ...
}
async function waitForStockElementVisible(page, sel) {
    // ... existing code ...
}
// --- TEMPLATE FOR ADDING NEW STRATEGIES ---
// Copy this template to create new site-specific extractors:
//
// async function extractNewSitePrice(page: any): Promise<number | string | null> {
//   return await page.evaluate(() => {
//     // Try structured data first
//     const structuredPrice = document.querySelector('meta[itemprop="price"]');
//     if (structuredPrice && structuredPrice.getAttribute('content')) {
//       return structuredPrice.getAttribute('content');
//     }
//     
//     // Try site-specific selectors
//     const priceEl = document.querySelector('.new-site-price, #price-selector');
//     if (priceEl && priceEl.textContent) return priceEl.textContent.trim();
//     
//     // Try pattern matching
//     const match = document.body.innerText.match(/\$\d+[\.,]?\d*/);
//     if (match) return match[0];
//     
//     return null;
//   });
// }
//
// async function extractNewSiteImage(page: any): Promise<string | null> {
//   return await page.evaluate(() => {
//     // Try structured data first
//     const structuredImg = document.querySelector('img[itemprop="image"]');
//     if (structuredImg && (structuredImg as HTMLImageElement).src) {
//       return (structuredImg as HTMLImageElement).src;
//     }
//     
//     // Try site-specific selectors
//     const mainImg = document.querySelector('.new-site-product-image, #main-image');
//     if (mainImg && (mainImg as HTMLImageElement).src) return (mainImg as HTMLImageElement).src;
//     
//     return null;
//   });
// }
//
// async function extractNewSiteStock(page: any): Promise<{ inStock: boolean | null, stockStatus: string }> {
//   return await page.evaluate(() => {
//     // Try structured data first
//     const avail = document.querySelector('link[itemprop="availability"]')?.getAttribute('href');
//     if (avail) {
//       if (avail.toLowerCase().includes('instock')) return { inStock: true, stockStatus: 'In Stock' };
//       if (avail.toLowerCase().includes('outofstock')) return { inStock: false, stockStatus: 'Out of Stock' };
//     }
//     
//     // Try site-specific selectors
//     const inStockBtn = document.querySelector('.add-to-cart, .buy-now');
//     if (inStockBtn) return { inStock: true, stockStatus: 'In Stock' };
//     
//     const outStockEl = document.querySelector('.out-of-stock, .sold-out');
//     if (outStockEl) return { inStock: false, stockStatus: 'Out of Stock' };
//     
//     return { inStock: null, stockStatus: 'Unknown' };
//   });
// }
//
// --- END TEMPLATE --- 
