// @ts-nocheck
// Puppeteer Stealth
const puppeteer = require('puppeteer-extra');
const puppeteerStealth = require('puppeteer-extra-plugin-stealth');
puppeteer.use(puppeteerStealth());

// Playwright (no stealth plugin, just use your own stealth code)
const playwright = require('playwright');
const { chromium } = playwright;
// Do NOT require or use playwright-extra or playwright-extra-plugin-stealth

import path from 'path';
import fs from 'fs';
// If you need types:
import type { Page } from 'playwright';
import * as os from 'os';
import * as path from 'path';

puppeteer.use(puppeteerStealth());

// Enhanced stealth configuration with multiple user agents and realistic browser fingerprints
const STEALTH_CONFIG = {
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ],
  viewports: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 },
    { width: 1280, height: 720 }
  ],
  languages: [
    'en-US,en;q=0.9',
    'en-GB,en;q=0.9',
    'en-CA,en;q=0.9',
    'en-US,en;q=0.8,es;q=0.5',
    'en-US,en;q=0.9,fr;q=0.8'
  ],
  timezones: [
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris'
  ],
  // Proxy rotation (add your proxy list here)
  proxies: [
    // Example format: 'http://username:password@proxy1.com:8080'
    // Add your actual proxy list here
  ],
  // Rate limiting configuration
  rateLimit: {
    minDelay: 3000,  // Minimum delay between requests (ms)
    maxDelay: 8000,  // Maximum delay between requests (ms)
    maxRequestsPerMinute: 10, // Maximum requests per minute
    maxRequestsPerHour: 100   // Maximum requests per hour
  },
  // Advanced stealth settings
  advanced: {
    // TLS fingerprinting
    tlsFingerprint: {
      ciphers: [
        'TLS_AES_128_GCM_SHA256',
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256'
      ],
      sigalgs: [
        'ecdsa_secp256r1_sha256',
        'rsa_pss_rsae_sha256',
        'rsa_pkcs1_sha256',
        'ecdsa_secp384r1_sha384',
        'rsa_pss_rsae_sha384'
      ]
    },
    // HTTP/2 settings
    http2: {
      enablePush: true,
      maxConcurrentStreams: 100,
      initialWindowSize: 65536,
      maxHeaderListSize: 262144
    },
    // WebRTC protection
    webrtc: {
      enable: false, // Disable WebRTC to prevent IP leakage
      blockLocalAddresses: true,
      blockPrivateAddresses: true
    }
  }
};

// Request tracking for rate limiting
let requestCount = {
  minute: 0,
  hour: 0,
  lastMinuteReset: Date.now(),
  lastHourReset: Date.now()
};

// Function to get random item from array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to add random delay between requests with rate limiting
async function randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
  // Check rate limits
  const now = Date.now();
  
  // Reset counters if needed
  if (now - requestCount.lastMinuteReset >= 60000) {
    requestCount.minute = 0;
    requestCount.lastMinuteReset = now;
  }
  if (now - requestCount.lastHourReset >= 3600000) {
    requestCount.hour = 0;
    requestCount.lastHourReset = now;
  }
  
  // Check if we're over rate limits
  if (requestCount.minute >= STEALTH_CONFIG.rateLimit.maxRequestsPerMinute) {
    const waitTime = 60000 - (now - requestCount.lastMinuteReset);
    console.log(`Rate limit reached. Waiting ${waitTime}ms before next request.`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    requestCount.minute = 0;
    requestCount.lastMinuteReset = Date.now();
  }
  
  if (requestCount.hour >= STEALTH_CONFIG.rateLimit.maxRequestsPerHour) {
    const waitTime = 3600000 - (now - requestCount.lastHourReset);
    console.log(`Hourly rate limit reached. Waiting ${waitTime}ms before next request.`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    requestCount.hour = 0;
    requestCount.lastHourReset = Date.now();
  }
  
  // Increment counters
  requestCount.minute++;
  requestCount.hour++;
  
  // Add random delay
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

// Function to get random proxy
function getRandomProxy(): string | null {
  if (STEALTH_CONFIG.proxies.length === 0) {
    return null;
  }
  return getRandomItem(STEALTH_CONFIG.proxies);
}

// Function to simulate realistic typing behavior
async function simulateTyping(page: any, selector: string, text: string): Promise<void> {
  await page.focus(selector);
  await page.evaluate((sel: string) => {
    const element = document.querySelector(sel) as HTMLInputElement;
    if (element) {
      element.value = '';
    }
  }, selector);
  
  for (const char of text) {
    await page.keyboard.type(char);
    await randomDelay(50, 150); // Random delay between keystrokes
  }
}

// Function to simulate realistic scrolling
async function simulateScrolling(page: any): Promise<void> {
  const scrollSteps = Math.floor(Math.random() * 5) + 3; // 3-7 scroll steps
  
  for (let i = 0; i < scrollSteps; i++) {
    const scrollAmount = Math.floor(Math.random() * 300) + 100; // 100-400px
    await page.evaluate((amount: number) => {
      window.scrollBy(0, amount);
    }, scrollAmount);
    await randomDelay(500, 1500); // Random delay between scrolls
  }
  
  // Scroll back up partially
  await page.evaluate(() => {
    window.scrollTo(0, Math.random() * 200);
  });
  await randomDelay(500, 1000);
}

// Function to add realistic browser extensions
async function addRealisticExtensions(page: any): Promise<void> {
  await page.evaluate(() => {
    // Simulate common browser extensions
    (window as any).chrome = {
      runtime: {
        id: 'extension_' + Math.random().toString(36).substring(2),
        getManifest: () => ({}),
        sendMessage: () => {},
        onMessage: { addListener: () => {} }
      },
      tabs: {
        query: () => Promise.resolve([]),
        sendMessage: () => Promise.resolve()
      },
      storage: {
        local: {
          get: () => Promise.resolve({}),
          set: () => Promise.resolve()
        }
      }
    };
    
    // Add some common extension elements to DOM
    const extensionDiv = document.createElement('div');
    extensionDiv.id = 'extension-container';
    extensionDiv.style.display = 'none';
    document.body.appendChild(extensionDiv);
  });
}

// Function to protect against WebRTC IP leakage
async function protectWebRTC(page: any): Promise<void> {
  await page.evaluate(() => {
    // Override WebRTC to prevent IP leakage
    if (navigator.mediaDevices) {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = function(constraints: any) {
        return Promise.reject(new Error('Permission denied'));
      };
    }
    
    // Override RTCPeerConnection
    if ((window as any).RTCPeerConnection) {
      const originalRTCPeerConnection = (window as any).RTCPeerConnection;
      (window as any).RTCPeerConnection = function(configuration: any) {
        const pc = new originalRTCPeerConnection(configuration);
        
        // Override createOffer to prevent IP leakage
        const originalCreateOffer = pc.createOffer;
        pc.createOffer = function(options: any) {
          return originalCreateOffer.call(this, options).then((offer: any) => {
            // Remove any IP addresses from SDP
            if (offer.sdp) {
              offer.sdp = offer.sdp.replace(/c=IN IP4 [0-9.]+/g, 'c=IN IP4 0.0.0.0');
            }
            return offer;
          });
        };
        
        // Override createAnswer similarly
        const originalCreateAnswer = pc.createAnswer;
        pc.createAnswer = function(options: any) {
          return originalCreateAnswer.call(this, options).then((answer: any) => {
            if (answer.sdp) {
              answer.sdp = answer.sdp.replace(/c=IN IP4 [0-9.]+/g, 'c=IN IP4 0.0.0.0');
            }
            return answer;
          });
        };
        
        return pc;
      };
    }
  });
}

// Function to prevent timing attacks
async function preventTimingAttacks(page: any): Promise<void> {
  await page.evaluate(() => {
    // Override performance.now() to add jitter
    const originalPerformanceNow = performance.now;
    performance.now = function() {
      const time = originalPerformanceNow.call(this);
      // Add small random jitter (±1ms) to prevent timing fingerprinting
      return time + (Math.random() * 2 - 1);
    };
    
    // Override Date.now() to add jitter
    const originalDateNow = Date.now;
    Date.now = function() {
      const time = originalDateNow.call(this);
      return time + (Math.random() * 2 - 1);
    };
    
    // Override getTime() to add jitter
    const originalGetTime = Date.prototype.getTime;
    Date.prototype.getTime = function() {
      const time = originalGetTime.call(this);
      return time + (Math.random() * 2 - 1);
    };
  });
}

// Function to add advanced fingerprinting protection
async function addAdvancedFingerprintingProtection(page: any): Promise<void> {
  await page.evaluate(() => {
    // Override battery API
    if ((navigator as any).getBattery) {
      (navigator as any).getBattery = function() {
        return Promise.resolve({
          charging: true,
          chargingTime: Infinity,
          dischargingTime: Infinity,
          level: 0.8
        });
      };
    }
    
    // Override device orientation
    if ((window as any).DeviceOrientationEvent) {
      (window as any).DeviceOrientationEvent = function() {
        return {
          alpha: null,
          beta: null,
          gamma: null
        };
      };
    }
    
    // Override device motion
    if ((window as any).DeviceMotionEvent) {
      (window as any).DeviceMotionEvent = function() {
        return {
          acceleration: null,
          accelerationIncludingGravity: null,
          rotationRate: null
        };
      };
    }
    
    // Override screen orientation
    if (screen.orientation) {
      if (!Object.getOwnPropertyDescriptor(screen.orientation, 'angle')) {
        Object.defineProperty(screen.orientation, 'angle', {
          get: () => 0
        });
      }
      if (!Object.getOwnPropertyDescriptor(screen.orientation, 'type')) {
        Object.defineProperty(screen.orientation, 'type', {
          get: () => 'landscape-primary'
        });
      }
    }
    
    // Override media queries
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = function(query: string) {
      const result = originalMatchMedia.call(this, query);
      // Add slight delay to prevent timing attacks
      setTimeout(() => {}, Math.random() * 10);
      return result;
    };
    
    // Override getComputedStyle to prevent CSS fingerprinting
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function(element: Element, pseudoElement?: string | null) {
      const style = originalGetComputedStyle.call(this, element, pseudoElement);
      
      // Add slight variations to font metrics
      const originalGetPropertyValue = style.getPropertyValue;
      style.getPropertyValue = function(property: string) {
        const value = originalGetPropertyValue.call(this, property);
        
        // Add slight variations to font-related properties
        if (property === 'font-family' || property === 'font-size') {
          // Return consistent values to prevent fingerprinting
          return value;
        }
        
        return value;
      };
      
      return style;
    };
  });
}

// Function to simulate realistic browser startup behavior
async function simulateBrowserStartup(page: any): Promise<void> {
  await page.evaluate(() => {
    // Simulate browser startup events
    const startupTime = Date.now();
    
    // Simulate DOMContentLoaded timing
    setTimeout(() => {
      const event = new Event('DOMContentLoaded', { bubbles: true });
      document.dispatchEvent(event);
    }, Math.random() * 100 + 50);
    
    // Simulate load event timing
    setTimeout(() => {
      const event = new Event('load', { bubbles: true });
      window.dispatchEvent(event);
    }, Math.random() * 200 + 100);
    
    // Simulate various browser events
    const events = [
      'focus',
      'blur',
      'resize',
      'scroll',
      'mousemove',
      'mouseenter',
      'mouseleave'
    ];
    
    events.forEach(eventType => {
      setTimeout(() => {
        const event = new Event(eventType, { bubbles: true });
        document.dispatchEvent(event);
      }, Math.random() * 1000 + 500);
    });
  });
}

// Function to add realistic network behavior
async function addRealisticNetworkBehavior(page: any): Promise<void> {
  await page.evaluate(() => {
    // Override fetch to add realistic timing
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const startTime = performance.now();
      return originalFetch.call(this, input, init).then(response => {
        const endTime = performance.now();
        // Add realistic network timing variations
        const delay = Math.random() * 50 + 10;
        return new Promise(resolve => {
          setTimeout(() => resolve(response), delay);
        });
      });
    };
    
    // Override XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
      const startTime = performance.now();
      const result = originalXHROpen.call(this, method, url, async ?? true, username, password);
      
      // Add realistic timing for XHR requests
      const originalSend = this.send;
      this.send = function(data?: Document | XMLHttpRequestBodyInit | null) {
        const delay = Math.random() * 30 + 5;
        setTimeout(() => {
          originalSend.call(this, data);
        }, delay);
      };
      
      return result;
    };
  });
}

// Function to add realistic form interaction
async function addRealisticFormInteraction(page: any): Promise<void> {
  await page.evaluate(() => {
    // Override form submission to add realistic behavior
    const originalSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function() {
      // Add slight delay before form submission
      setTimeout(() => {
        originalSubmit.call(this);
      }, Math.random() * 500 + 100);
    };
    
    // Override input events to add realistic typing behavior
    const inputElements = document.querySelectorAll('input, textarea');
    inputElements.forEach(input => {
      input.addEventListener('focus', () => {
        // Simulate focus delay
        setTimeout(() => {}, Math.random() * 100);
      });
      
      input.addEventListener('blur', () => {
        // Simulate blur delay
        setTimeout(() => {}, Math.random() * 100);
      });
    });
  });
}

// Function to add realistic error handling
async function addRealisticErrorHandling(page: any): Promise<void> {
  await page.evaluate(() => {
    // Override console methods to appear more realistic
    const originalConsoleError = console.error;
    console.error = function(...args) {
      // Sometimes don't log errors to appear more realistic
      if (Math.random() > 0.3) {
        originalConsoleError.apply(this, args);
      }
    };
    
    // Override window.onerror to handle errors realistically
    window.onerror = function(message, source, lineno, colno, error) {
      // Don't always handle errors to appear more realistic
      if (Math.random() > 0.5) {
        return false; // Let error propagate
      }
      return true; // Handle error
    };
  });
}

// Function to handle cookies and local storage realistically
async function handleStorageRealistically(page: any): Promise<void> {
  await page.evaluate(() => {
    try {
      document.cookie = 'session_id=' + Math.random().toString(36).substring(2);
      document.cookie = 'user_preferences=theme:dark;path=/';
      document.cookie = 'analytics_id=' + Math.random().toString(36).substring(2);
      document.cookie = 'last_visit=' + new Date().toISOString();
    } catch (e) { console.log('Cookie set error', e); }
    try {
      localStorage.setItem('lastVisit', new Date().toISOString());
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('language', 'en-US');
      localStorage.setItem('userPreferences', JSON.stringify({ notifications: true, autoPlay: false, accessibility: false }));
    } catch (e) { console.log('localStorage set error', e); }
    try {
      sessionStorage.setItem('currentSession', Math.random().toString(36).substring(2));
      sessionStorage.setItem('pageViews', '1');
    } catch (e) { console.log('sessionStorage set error', e); }
  });
}

// Function to simulate human-like mouse movements
async function simulateHumanMouse(page: any): Promise<void> {
  await page.evaluate(() => {
    // Global flag to prevent multiple redefinitions
    if ((window as any).__stealthApplied) {
      return;
    }
    (window as any).__stealthApplied = true;
    
    // Override navigator properties to appear more human
    if (!Object.getOwnPropertyDescriptor(navigator, 'webdriver')) {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    }
    
    // Override plugins - check if it's configurable first and not already modified
    try {
      const pluginsDescriptor = Object.getOwnPropertyDescriptor(navigator, 'plugins');
      if (!pluginsDescriptor || pluginsDescriptor.configurable) {
        // Check if plugins is already a getter that returns our fake array
        const currentPlugins = navigator.plugins;
        if (!Array.isArray(currentPlugins) || currentPlugins.length !== 5) {
          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
            configurable: true
          });
        }
      }
    } catch (error) {
      // If we can't redefine plugins, just continue
      console.log('Could not redefine plugins property');
    }
    
    // Override languages - check if it's configurable first
    try {
      const languagesDescriptor = Object.getOwnPropertyDescriptor(navigator, 'languages');
      if (!languagesDescriptor || languagesDescriptor.configurable) {
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
          configurable: true
        });
      }
    } catch (error) {
      // If we can't redefine languages, just continue
      console.log('Could not redefine languages property');
    }
    
    // Override permissions
    try {
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission } as any) :
          originalQuery(parameters)
      );
    } catch (error) {
      // If we can't override permissions, just continue
      console.log('Could not override permissions query');
    }
    
    // Override chrome runtime
    try {
      (window as any).chrome = {
        runtime: {},
      };
    } catch (error) {
      // If we can't override chrome, just continue
      console.log('Could not override chrome runtime');
    }
    
    // Override webGL vendor and renderer
    try {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel(R) Iris(TM) Graphics 6100';
        }
        return getParameter.call(this, parameter);
      };
    } catch (error) {
      // If we can't override WebGL, just continue
      console.log('Could not override WebGL parameters');
    }
  });
}

// Function to set realistic browser fingerprint for Playwright
async function setRealisticFingerprintPlaywright(page: any): Promise<void> {
  const userAgent = getRandomItem(STEALTH_CONFIG.userAgents);
  const viewport = getRandomItem(STEALTH_CONFIG.viewports);
  const language = getRandomItem(STEALTH_CONFIG.languages);
  const timezone = getRandomItem(STEALTH_CONFIG.timezones);
  const context = page.context();
  // User agent and viewport are set in context creation, not here
  await context.setExtraHTTPHeaders({
    'accept-language': language,
    'accept-encoding': 'gzip, deflate, br',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1'
  });
  try { await page.emulateTimezone(timezone); } catch {}
  try { await page.setGeolocation({ latitude: 40.7128, longitude: -74.0060 }); } catch {}
  try { if (context && context.grantPermissions) await context.grantPermissions(['geolocation']); } catch {}
}

// Function to set realistic browser fingerprint for Puppeteer
async function setRealisticFingerprintPuppeteer(page: any): Promise<void> {
  const userAgent = getRandomItem(STEALTH_CONFIG.userAgents);
  const viewport = getRandomItem(STEALTH_CONFIG.viewports);
  const language = getRandomItem(STEALTH_CONFIG.languages);
  const timezone = getRandomItem(STEALTH_CONFIG.timezones);
  
  await page.setUserAgent(userAgent);
  await page.setViewport(viewport);
  await page.setExtraHTTPHeaders({
    'accept-language': language,
    'accept-encoding': 'gzip, deflate, br',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': userAgent
  });
  
  // Set timezone
  try {
    await page.emulateTimezone(timezone);
  } catch (error) {
    // Fallback if emulateTimezone is not available
    console.log('Timezone emulation not available, using default');
  }
  
  // Set geolocation to a realistic location
  try {
    await page.setGeolocation({
      latitude: 40.7128,
      longitude: -74.0060
    });
  } catch (error) {
    // Fallback if setGeolocation is not available
    console.log('Geolocation setting not available, using default');
  }
  
  // Set permissions using the correct Puppeteer API
  try {
    const context = page.context();
    if (context && context.grantPermissions) {
      await context.grantPermissions(['geolocation']);
    }
  } catch (error) {
    // Fallback if permissions API is not available
    console.log('Permissions API not available, using default');
  }
}

// Function to add realistic mouse movements
async function addRealisticMouseMovements(page: any): Promise<void> {
  await page.evaluate(() => {
    // Create realistic mouse movement patterns
    const originalMouseEvent = window.MouseEvent;
    (window as any).MouseEvent = function(type: string, init: any) {
      if (init && init.movementX === 0 && init.movementY === 0) {
        init.movementX = Math.floor(Math.random() * 10) - 5;
        init.movementY = Math.floor(Math.random() * 10) - 5;
      }
      return new originalMouseEvent(type, init);
    };
  });
}

// Function to bypass common bot detection methods
async function bypassBotDetection(page: any): Promise<void> {
  await page.evaluate(() => {
    // Global flag to prevent multiple redefinitions
    if ((window as any).__stealthApplied) {
      return;
    }
    
    // Override common bot detection methods
    (window as any).navigator.webdriver = undefined;
    
    // Override automation properties
    delete (window as any).navigator.__proto__.webdriver;
    
    // Override chrome automation
    try {
      (window as any).chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
    } catch (error) {
      console.log('Could not override chrome automation');
    }
    
    // Override permissions API
    try {
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission } as any) :
          originalQuery(parameters)
      );
    } catch (error) {
      console.log('Could not override permissions API');
    }
    
    // Override plugins - check if it's configurable first and not already modified
    try {
      const pluginsDescriptor = Object.getOwnPropertyDescriptor(navigator, 'plugins');
      if (!pluginsDescriptor || pluginsDescriptor.configurable) {
        // Check if plugins is already a getter that returns our fake array
        const currentPlugins = navigator.plugins;
        if (!Array.isArray(currentPlugins) || currentPlugins.length !== 5) {
          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
            configurable: true
          });
        }
      }
    } catch (error) {
      console.log('Could not override plugins');
    }
    
    // Override languages - check if it's configurable first
    try {
      const languagesDescriptor = Object.getOwnPropertyDescriptor(navigator, 'languages');
      if (!languagesDescriptor || languagesDescriptor.configurable) {
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
          configurable: true
        });
      }
    } catch (error) {
      console.log('Could not override languages');
    }
    
    // Override connection - check if it's configurable first
    try {
      const connectionDescriptor = Object.getOwnPropertyDescriptor(navigator, 'connection');
      if (!connectionDescriptor || connectionDescriptor.configurable) {
        Object.defineProperty(navigator, 'connection', {
          get: () => ({
            effectiveType: '4g',
            rtt: 50,
            downlink: 10,
            saveData: false
          }),
          configurable: true
        });
      }
    } catch (error) {
      console.log('Could not override connection');
    }
    
    // Override hardware concurrency - check if it's configurable first
    try {
      const hardwareConcurrencyDescriptor = Object.getOwnPropertyDescriptor(navigator, 'hardwareConcurrency');
      if (!hardwareConcurrencyDescriptor || hardwareConcurrencyDescriptor.configurable) {
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 8,
          configurable: true
        });
      }
    } catch (error) {
      console.log('Could not override hardware concurrency');
    }
    
    // Override device memory - check if it's configurable first
    try {
      const deviceMemoryDescriptor = Object.getOwnPropertyDescriptor(navigator, 'deviceMemory');
      if (!deviceMemoryDescriptor || deviceMemoryDescriptor.configurable) {
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => 8,
          configurable: true
        });
      }
    } catch (error) {
      console.log('Could not override device memory');
    }
    
    // Override maxTouchPoints - check if it's configurable first
    try {
      const maxTouchPointsDescriptor = Object.getOwnPropertyDescriptor(navigator, 'maxTouchPoints');
      if (!maxTouchPointsDescriptor || maxTouchPointsDescriptor.configurable) {
        Object.defineProperty(navigator, 'maxTouchPoints', {
          get: () => 0,
          configurable: true
        });
      }
    } catch (error) {
      console.log('Could not override maxTouchPoints');
    }
    
    // Override WebGL
    try {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel(R) Iris(TM) Graphics 6100';
        }
        return getParameter.call(this, parameter);
      };
    } catch (error) {
      console.log('Could not override WebGL');
    }
    
    // Override canvas fingerprinting
    try {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      (HTMLCanvasElement.prototype as any).getContext = function(type: string, attributes?: any) {
        const context = originalGetContext.call(this, type, attributes);
        if (type === '2d' && context) {
          const canvasContext = context as CanvasRenderingContext2D;
          const originalFillText = canvasContext.fillText;
          canvasContext.fillText = function(text: string, x: number, y: number, maxWidth?: number) {
            // Add slight variations to text rendering
            const offsetX = x + (Math.random() * 0.1 - 0.05);
            const offsetY = y + (Math.random() * 0.1 - 0.05);
            return originalFillText.call(this, text, offsetX, offsetY, maxWidth);
          };
        }
        return context;
      };
    } catch (error) {
      console.log('Could not override canvas fingerprinting');
    }
    
    // Override audio fingerprinting
    try {
      const originalGetChannelData = AudioBuffer.prototype.getChannelData;
      AudioBuffer.prototype.getChannelData = function(channel: number) {
        const data = originalGetChannelData.call(this, channel);
        // Add slight noise to audio data
        for (let i = 0; i < data.length; i += 100) {
          data[i] += (Math.random() * 0.0001 - 0.00005);
        }
        return data;
      };
    } catch (error) {
      console.log('Could not override audio fingerprinting');
    }
  });
}

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
      '#add-to-cart-button',
      '#buy-now-button'
    ],
    outOfStock: [
      '#availability .a-color-price'
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
      '.cta-button',
      '.buy-now',
    ],
    outOfStock: [
      '.out-of-stock',
      '.unavailable',
      '.sold-out'
    ]
  },
  // Generic fallback
  'default': {
    inStock: [
      '.add-to-cart',
      '.buy-now',
      '.in-stock',
      '.available'
    ],
    outOfStock: [
      '.out-of-stock',
      '.unavailable',
      '.sold-out'
    ]
  }
};

// Extend the Window interface for custom debug properties
declare global {
  interface Window {
    __ebayDebugProximityPrices?: any;
    __ebayFinalProximityPrice?: any;
    __ebayDebugFallbackPrices?: any;
    __ebayFinalFallbackPrice?: any;
    __ebayDebugAllDollarEls?: any;
    __ebayFinalLooseDollar?: any;
    __ebayDebugTitleHeadings?: any;
    __ebayDebugBodyHTML?: any;
    __ebayAllTextspans?: string[];
  }
}

// --- SITE-SPECIFIC PRICE EXTRACTORS ---
// To add a new site-specific price extractor:
// 1. Create a new function like: async function extractNewSitePrice(page: any): Promise<number | string | null>
// 2. Add it to the strategies array in masterExtractPrice() below
// 3. The master scraper will try it for ALL sites, not just the specific site

async function extractAmazonPrice(page: any): Promise<number | string | null> {
  return await page.evaluate(() => {
    // 1. Try .a-price .a-offscreen inside #corePriceDisplay_desktop_feature_div
    const priceEl = document.querySelector('#corePriceDisplay_desktop_feature_div .a-price .a-offscreen');
    if (priceEl && priceEl.textContent) return priceEl.textContent.trim();
    // 2. Try #priceblock_ourprice, #priceblock_dealprice, #priceblock_saleprice
    const el = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, #priceblock_saleprice');
    if (el && el.textContent) return el.textContent.trim();
    // 3. Try combining .a-price-whole and .a-price-fraction
    const whole = document.querySelector('.a-price-whole');
    const fraction = document.querySelector('.a-price-fraction');
    if (whole && fraction) {
      return `${whole.textContent?.replace(/[^0-9]/g, '')}.${fraction.textContent?.replace(/[^0-9]/g, '')}`;
    }
    // 4. Fallback: first .a-offscreen anywhere
    const offscreen = document.querySelector('.a-offscreen');
    if (offscreen && offscreen.textContent) return offscreen.textContent.trim();
    return null;
  });
}

async function extractEbayPrice(page: any): Promise<number | string | null> {
  return await page.evaluate(() => {
    const allTextspans = Array.from(document.querySelectorAll('.ux-textspans')).map(el => el.textContent?.trim() || '');
    for (const text of allTextspans) {
      if (text && text.match(/\$[0-9,.]+/)) return text;
    }
    return null;
  });
}

async function extractPlayStationPrice(page: any): Promise<number | string | null> {
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
async function extractAmazonImage(page: any): Promise<string | null> {
  return await page.evaluate(() => {
    // 1. Main product image inside the wrapper
    const mainImg = document.querySelector('#imgTagWrapperId img');
    if (mainImg && mainImg.src) return mainImg.src;
    // 2. Sometimes Amazon uses an explicit landingImage id
    const landingImg = document.querySelector('img#landingImage');
    if (landingImg && landingImg.src) return landingImg.src;
    // 3. Open Graph image as a fallback
    const og = document.querySelector('meta[property="og:image"]');
    if (og && og.getAttribute('content')) return og.getAttribute('content');
    // No generic fallback to first <img> to avoid thumbnails
    return null;
  });
}

async function extractEbayImage(page: any): Promise<string | null> {
  return await page.evaluate(() => {
    const og = document.querySelector('meta[property="og:image"]');
    if (og && og.getAttribute('content')) return og.getAttribute('content');
    const icImg = document.querySelector('img#icImg');
    if (icImg && (icImg as HTMLImageElement).src) return (icImg as HTMLImageElement).src;
    const mainImg = document.querySelector('img[aria-hidden="false"]');
    if (mainImg && (mainImg as HTMLImageElement).src) return (mainImg as HTMLImageElement).src;
    const img = document.querySelector('img');
    if (img && (img as HTMLImageElement).src) return (img as HTMLImageElement).src;
    return null;
  });
}

async function extractPlayStationImage(page: any): Promise<string | null> {
  return await page.evaluate(() => {
    const structuredImg = document.querySelector('img[itemprop="image"]');
    if (structuredImg && (structuredImg as HTMLImageElement).src) {
      return (structuredImg as HTMLImageElement).src;
    }
    const heroImgs = Array.from(document.querySelectorAll('img.hero-banner.background'));
    for (const img of heroImgs) {
      const alt = img.getAttribute('alt');
      if (alt && alt.includes('PS5') && (img as HTMLImageElement).src) {
        return (img as HTMLImageElement).src;
      }
    }
    return null;
  });
}

// Staples-specific image extractor
async function extractStaplesImage(page: any): Promise<string | null> {
  return await page.evaluate(() => {
    // 1. Try to extract from JSON-LD (schema.org Product)
    const ldJson = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const script of ldJson) {
      try {
        const data = JSON.parse(script.textContent || '{}');
        if (Array.isArray(data)) {
          for (const obj of data) {
            if (obj['@type'] === 'Product' && obj.image && typeof obj.image === 'string') {
              if (!obj.image.toLowerCase().includes('logo')) return obj.image;
            }
            if (obj['@type'] === 'Product' && Array.isArray(obj.image) && obj.image.length > 0) {
              const img = obj.image.find((i: string) => !i.toLowerCase().includes('logo'));
              if (img) return img;
            }
          }
        } else if (data['@type'] === 'Product' && data.image) {
          if (typeof data.image === 'string' && !data.image.toLowerCase().includes('logo')) return data.image;
          if (Array.isArray(data.image) && data.image.length > 0) {
            const img = data.image.find((i: string) => !i.toLowerCase().includes('logo'));
            if (img) return img;
          }
        }
      } catch {}
    }

    // 2. Try to find the main product image in the image gallery
    const galleryImgs = Array.from(document.querySelectorAll('.image-gallery-ux2dot0__image_gallery img, .image-gallery-ux2dot0__thumbnails_container img'));
    for (const img of galleryImgs) {
      const src = (img as HTMLImageElement).src || '';
      if (src.includes('staples-3p.com/s7/is/image/Staples/') && !src.toLowerCase().includes('logo') && !src.startsWith('data:')) {
        return src;
      }
      // Try srcset for higher-res
      const srcset = (img as HTMLImageElement).srcset || '';
      if (srcset) {
        const best = srcset.split(',').map(s => s.trim().split(' ')[0]).find(s => s.includes('staples-3p.com/s7/is/image/Staples/') && !s.toLowerCase().includes('logo'));
        if (best) return best;
      }
    }

    // 3. Fallback: any large image on the page that is not a logo
    const largeImgs = Array.from(document.images)
      .filter(img => img.width > 100 && img.height > 100 && img.src && !img.src.toLowerCase().includes('logo') && img.src.includes('staples-3p.com/s7/is/image/Staples/') && !img.src.startsWith('data:'));
    if (largeImgs.length > 0) {
      largeImgs.sort((a, b) => (b.width * b.height) - (a.width * a.height));
      return largeImgs[0].src;
    }
    return null;
  });
}

// --- SITE-SPECIFIC STOCK EXTRACTORS ---
async function extractAmazonStock(page: any): Promise<{ inStock: boolean | null, stockStatus: string }> {
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

async function extractEbayStock(page: any): Promise<{ inStock: boolean | null, stockStatus: string }> {
  return await page.evaluate(() => {
    const buyNow = document.querySelector('button[aria-label*="Buy It Now" i], button[aria-label*="Add to cart" i], button[title*="Buy It Now" i], button[title*="Add to cart" i], button.btn.btn--primary');
    if (buyNow) return { inStock: true, stockStatus: 'In Stock' };
    const ended = document.body.innerText.match(/This listing was ended|sold|out of stock/i);
    if (ended) return { inStock: false, stockStatus: 'Out of Stock' };
    return { inStock: null, stockStatus: 'Unknown' };
  });
}

async function extractPlayStationStock(page: any): Promise<{ inStock: boolean | null, stockStatus: string }> {
  return await page.evaluate(() => {
    const avail = document.querySelector('link[itemprop="availability"]')?.getAttribute('href');
    if (avail) {
      if (avail.toLowerCase().includes('instock')) return { inStock: true, stockStatus: 'In Stock' };
      if (avail.toLowerCase().includes('outofstock')) return { inStock: false, stockStatus: 'Out of Stock' };
    }
    const btn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent && btn.textContent.toLowerCase().includes('add to cart'));
    if (btn) return { inStock: true, stockStatus: 'In Stock' };
    const outBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent && btn.textContent.toLowerCase().includes('out of stock'));
    if (outBtn) return { inStock: false, stockStatus: 'Out of Stock' };
    return { inStock: null, stockStatus: 'Unknown' };
  });
}

// --- SEPHORA-SPECIFIC EXTRACTORS ---
async function extractSephoraPrice(page: any): Promise<number | string | null> {
  return await page.evaluate(() => {
    console.log('[DEBUG] Running Sephora price extraction...');
    
    // 1. Look for price in <b> or <span> elements with css-0 class (found in HTML)
    const priceElements = Array.from(document.querySelectorAll('b.css-0, span.css-0'));
    console.log('[DEBUG] Found css-0 price elements:', priceElements.length);
    
    for (const el of priceElements) {
      if (!el.textContent) continue;
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
      if (!script.textContent) continue;
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
    const btn = Array.from(document.querySelectorAll('button')).find(
      el => el.textContent && /add to basket/i.test(el.textContent)
    );
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

async function extractSephoraImage(page: any): Promise<string | null> {
  return await page.evaluate(() => {
    console.log('[DEBUG] Running Sephora image extraction...');
    
    // 1. Look for main product image in foreignObject elements (actual structure found in HTML)
    const foreignObjects = Array.from(document.querySelectorAll('foreignObject img'));
    console.log('[DEBUG] Found foreignObject images:', foreignObjects.length);
    
    for (const img of foreignObjects) {
      const image = img as HTMLImageElement;
      if (image.src && image.src.includes('main-zoom.jpg')) {
        console.log('[DEBUG] Found main-zoom image in foreignObject:', image.src);
        return image.src;
      }
    }
    
    // 2. Look for any img with main-zoom.jpg in srcset
    const imgs = Array.from(document.querySelectorAll('img[srcset*="main-zoom.jpg"]'));
    console.log('[DEBUG] Found main-zoom images:', imgs.length);
    
    for (const img of imgs) {
      const image = img as HTMLImageElement;
      if (image.src && image.src.includes('main-zoom.jpg')) {
        console.log('[DEBUG] Found main-zoom image:', image.src);
        return image.src;
      }
    }
    
    // 3. Look for productimages URLs in any img src
    const productImgs = Array.from(document.querySelectorAll('img[src*="productimages/sku/"]'));
    console.log('[DEBUG] Found productimages:', productImgs.length);
    
    for (const img of productImgs) {
      const image = img as HTMLImageElement;
      if (image.src && image.src.includes('main-zoom.jpg')) {
        console.log('[DEBUG] Found main product image:', image.src);
        return image.src;
      }
    }
    
    // 4. Look for any img with productimages/sku/ in src
    const allProductImgs = Array.from(document.querySelectorAll('img[src*="productimages/sku/"]'));
    console.log('[DEBUG] Found all productimages:', allProductImgs.length);
    
    if (allProductImgs.length > 0) {
      // Get the first one (usually the main product image)
      const image = allProductImgs[0] as HTMLImageElement;
      console.log('[DEBUG] Selected first product image:', image.src);
      return image.src;
    }
    
    // 5. Fallback: first large image
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

async function extractSephoraStock(page: any): Promise<{ inStock: boolean | null, stockStatus: string }> {
  return await page.evaluate(() => {
    // If Add to Basket button is visible and enabled, it's in stock
    const btn = Array.from(document.querySelectorAll('button')).find(
      el => el.textContent && /add to basket/i.test(el.textContent)
    );
    if (btn && !btn.disabled && btn.offsetParent !== null) return { inStock: true, stockStatus: 'In Stock' };
    if (btn && (btn.disabled || btn.offsetParent === null)) return { inStock: false, stockStatus: 'Out of Stock' };
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

async function masterExtractPrice(page: any): Promise<number | string | null> {
  const scrapeId = Date.now();
  const screenshotPath = path.resolve(__dirname, `../../../debug-price-extraction-${scrapeId}.png`);
  
  try {
    // Take screenshot before price extraction
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[DEBUG] Price extraction screenshot saved: ${screenshotPath}`);
    
    const strategies = [
      // Generic strategies (try these first)
      async () => await page.evaluate(() => {
        let price = document.querySelector('meta[itemprop="price"]')?.getAttribute('content');
        if (price) return price;
        price = document.querySelector('meta[property="product:price:amount"]')?.getAttribute('content')
          || document.querySelector('meta[property="og:price:amount"]')?.getAttribute('content');
        if (price) return price;
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        for (const script of scripts) {
          try {
            const text = script.textContent;
            if (!text) continue;
            const data = JSON.parse(text);
            if (data && data.offers && data.offers.price) return data.offers.price;
            if (Array.isArray(data)) {
              for (const obj of data) {
                if (obj && obj.offers && obj.offers.price) return obj.offers.price;
              }
            }
          } catch {}
        }
        const el = document.querySelector('.price, .product-price, [data-price], .current-price, [class*="price"], [id*="price"]');
        if (el && el.textContent) return el.textContent.trim();
        return null;
      }),
      // Site-specific strategies (add new ones here)
      () => extractAmazonPrice(page),
      () => extractEbayPrice(page),
      () => extractPlayStationPrice(page),
      // Sephora-specific strategy (moved up to prioritize over generic fallbacks)
      () => extractSephoraPrice(page),
      // Target-specific price extraction
      async () => await page.evaluate(() => {
        const el = document.querySelector('span[data-test="product-price"]');
        if (el && el.textContent) {
          return el.textContent.trim();
        }
        return null;
      }),
      // Walgreens-specific price extraction
      async () => await page.evaluate(() => {
        // 1. Try to find price near the product title
        const title = document.querySelector('h1, h2, h3');
        if (title) {
          let container = title.closest('div, section, main, article');
          while (container) {
            const priceMatches = container.textContent?.match(/\$\d+[.,]?\d*/g) || [];
            // Filter out prices in coupon/promo blocks
            const filtered = priceMatches.filter(str => {
              const text = container.textContent.toLowerCase();
              return !/off|code|save|bogo|extra|reward|cash|earn|qualifying|shipping/.test(text);
            });
            if (filtered.length > 0) {
              return filtered[0];
            }
            container = container.parentElement;
          }
        }
        // 2. Fallback: Try to find a price above the Add to Cart button
        const button = Array.from(document.querySelectorAll('button, input[type="submit"]')).find(
          el => el.textContent && /add to cart|add for shipping|add to bag|buy now/i.test(el.textContent)
        );
        if (button) {
          let container = button.closest('div, section, form, main, article');
          while (container) {
            const priceMatches = container.textContent?.match(/\$\d+[.,]?\d*/g) || [];
            const filtered = priceMatches.filter(str => {
              const text = container.textContent.toLowerCase();
              return !/off|code|save|bogo|extra|reward|cash|earn|qualifying|shipping/.test(text);
            });
            if (filtered.length > 0) {
              return filtered[0];
            }
            container = container.parentElement;
          }
        }
        return null;
      }),
      // Walgreens-specific price selector (robust)
      async () => await page.evaluate(() => {
        // Try main price container
        let el = document.querySelector('div._PriceContainer-sc-10rlynh-12');
        if (el && el.textContent) {
          const match = el.textContent.match(/\$\d+[.,]?\d*/);
          if (match) return match[0];
        }
        // Try price__text (mobile/tablet/desktop)
        el = document.querySelector('div.price__text');
        if (el && el.textContent) {
          const match = el.textContent.match(/\$\d+[.,]?\d*/);
          if (match) return match[0];
        }
        el = document.querySelector('div.price__text-cont-desktop .price__text');
        if (el && el.textContent) {
          const match = el.textContent.match(/\$\d+[.,]?\d*/);
          if (match) return match[0];
        }
        return null;
      }),
      // Regex fallback: find the largest price on the page
      async () => await page.evaluate(() => {
        const matches = Array.from(document.body.innerText.matchAll(/\$\d+[\.,]?\d*/g)).map(m => m[0]);
        if (matches.length === 0) return null;
        // Convert to numbers and find the largest
        const prices = matches.map(str => parseFloat(str.replace(/[^\d.]/g, ''))).filter(n => !isNaN(n));
        if (prices.length === 0) return null;
        const max = Math.max(...prices);
        // Return the price string that matches the max value
        const best = matches.find(str => parseFloat(str.replace(/[^\d.]/g, '')) === max);
        return best || null;
      })
    ];
    
    for (const strategy of strategies) {
      const result = await strategy();
      if (result) {
        console.log(`[DEBUG] Price extraction result: ${result}`);
        return result;
      }
    }
    
    console.log(`[DEBUG] Price extraction failed - no strategies worked`);
    return null;
  } catch (error) {
    console.error('[DEBUG] Error in price extraction:', error);
    return null;
  }
}

async function masterExtractImage(page: any): Promise<string | null> {
  const scrapeId = Date.now();
  const screenshotPath = path.resolve(__dirname, `../../../debug-image-extraction-${scrapeId}.png`);

  try {
    // Take screenshot before image extraction
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[DEBUG] Image extraction screenshot saved: ${screenshotPath}`);

    // Get the current page URL and domain
    const url = page.url ? await page.url() : (await page.evaluate(() => window.location.href));
    const domain = url ? (new URL(url)).hostname : '';

    let strategies = [];

    if (domain.includes('amazon.')) {
      strategies = [
        () => extractAmazonImage(page),
      ];
    } else if (domain.includes('ebay.')) {
      strategies = [
        () => extractEbayImage(page),
      ];
    } else if (domain.includes('playstation.')) {
      strategies = [
        () => extractPlayStationImage(page),
      ];
    } else if (domain.includes('sephora.')) {
      strategies = [
        () => extractSephoraImage(page),
      ];
    } else if (domain.includes('staples.')) {
      strategies = [
        () => extractStaplesImage(page),
      ];
    }

    // Add generic strategies as fallback
    strategies.push(
      async () => await page.evaluate(() => {
        let img = document.querySelector('meta[property="og:image"]')?.getAttribute('content')
          || document.querySelector('meta[itemprop="image"]')?.getAttribute('content');
        if (img) return img;
        const mainImg = document.querySelector('.product-image, .main-image, img[alt*="product" i], img[alt*="main" i]');
        if (mainImg && (mainImg as HTMLImageElement).src) return (mainImg as HTMLImageElement).src;
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
      })
    );

    // Add all other site-specific strategies as additional fallbacks
    if (!domain.includes('amazon.')) strategies.push(() => extractAmazonImage(page));
    if (!domain.includes('ebay.')) strategies.push(() => extractEbayImage(page));
    if (!domain.includes('playstation.')) strategies.push(() => extractPlayStationImage(page));
    if (!domain.includes('sephora.')) strategies.push(() => extractSephoraImage(page));
    if (!domain.includes('staples.')) strategies.push(() => extractStaplesImage(page));

    for (const strategy of strategies) {
      const result = await strategy();
      if (result) {
        console.log(`[DEBUG] Image extraction result: ${result}`);
        return result;
      }
    }

    console.log(`[DEBUG] Image extraction failed - no strategies worked`);
    return null;
  } catch (error) {
    console.error('[DEBUG] Error in image extraction:', error);
    return null;
  }
}

async function extractAppleStock(page: any): Promise<{ inStock: boolean | null, stockStatus: string }> {
  return await page.evaluate(() => {
    // Helper to check if an element is visible
    function isVisible(el: Element) {
      const style = window.getComputedStyle(el);
      return style && style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
    }

    // First, check for positive stock indicators (Add to Bag button)
    const addToBagSelectors = [
      'button[data-autom="add-to-bag"]',
      'button:contains("Add to Bag")',
      'button:contains("Add to Cart")',
      'button:contains("Buy")',
      '[data-autom="add-to-bag"]',
      'button[aria-label*="Add to Bag"]',
      'button[aria-label*="Add to Cart"]'
    ];

    for (const selector of addToBagSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (isVisible(el)) {
            const text = el.textContent?.toLowerCase() || '';
            if (text.includes('add to bag') || text.includes('add to cart') || text.includes('buy')) {
              console.log('[DEBUG][APPLE_IN_STOCK] Found Add to Bag button:', text);
              return { inStock: true, stockStatus: 'In Stock' };
            }
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Check for specific out-of-stock indicators
    const oosSelectors = [
      'button[data-autom="pickup-button"]:contains("Unavailable")',
      'button[data-autom="delivery-button"]:contains("Unavailable")',
      'span:contains("Currently unavailable")',
      'div:contains("Currently unavailable")',
      'p:contains("Currently unavailable")'
    ];

    for (const selector of oosSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (isVisible(el)) {
            const text = el.textContent?.toLowerCase() || '';
            if (text.includes('unavailable') || text.includes('out of stock')) {
              console.log('[DEBUG][APPLE_OOS] Found unavailable indicator:', text);
              return { inStock: false, stockStatus: 'Out of Stock' };
            }
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Check for specific out-of-stock phrases in visible text (more restrictive)
    const oosPhrases = [
      'currently unavailable',
      'temporarily unavailable',
      'out of stock',
      'sold out'
    ];

    // Only check specific elements that are likely to contain stock status
    const stockElements = Array.from(document.querySelectorAll('button, span, div, p')).filter(el => {
      if (!isVisible(el) || !el.textContent) return false;
      const text = el.textContent.toLowerCase();
      // Only check elements that contain stock-related keywords
      return text.includes('unavailable') || text.includes('stock') || text.includes('available') || 
             text.includes('add to') || text.includes('buy') || text.includes('pickup') || text.includes('delivery');
    });

    for (const el of stockElements) {
      const text = el.textContent.trim().toLowerCase();
      for (const phrase of oosPhrases) {
        if (text.includes(phrase)) {
          console.log('[DEBUG][APPLE_OOS_MATCH]', phrase, 'in:', text);
          return { inStock: false, stockStatus: 'Out of Stock' };
        }
      }
    }

    // If no clear indicators found, default to in stock (since we found a price)
    console.log('[DEBUG][APPLE_DEFAULT] No clear stock indicators found, defaulting to in stock');
    return { inStock: true, stockStatus: 'In Stock' };
  });
}

// --- WALMART-SPECIFIC STOCK EXTRACTOR ---
async function extractWalmartStock(page: any): Promise<{ inStock: boolean | null, stockStatus: string }> {
  return await page.evaluate(() => {
    function isVisible(el) {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
    }
    const addToCartSelectors = [
      'button[data-automation-id="add-to-cart-button"]',
      'button[data-testid="add-to-cart-button"]',
      'button.prod-ProductCTA--primary',
      'button:enabled.add-to-cart-button',
      'button:enabled[data-automation-id*="add-to-cart"]',
      'button:enabled[data-testid*="add-to-cart"]',
    ];
    for (const selector of addToCartSelectors) {
      const btns = Array.from(document.querySelectorAll(selector));
      for (const btn of btns) {
        if (isVisible(btn) && !btn.disabled) {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('add to cart') || text.includes('add') || text.includes('cart')) {
            console.log('[DEBUG][WALMART_IN_STOCK] Found Add to Cart button:', text);
            return { inStock: true, stockStatus: 'In Stock' };
          }
        }
      }
    }
    const oosPhrases = [
      'out of stock',
      'unavailable',
      'sold out',
      'not available',
      'pickup not available',
      'delivery not available',
      'temporarily unavailable',
      'this item is no longer available',
    ];
    const productSection = document.querySelector('[data-automation-id="product-overview"], .prod-ProductPrimaryInformation, main, body');
    if (productSection) {
      const elements = Array.from(productSection.querySelectorAll('*')).filter(isVisible);
      for (const el of elements) {
        const text = el.textContent?.toLowerCase() || '';
        for (const phrase of oosPhrases) {
          if (text.includes(phrase)) {
            console.log('[DEBUG][WALMART_OOS_MATCH]', phrase, 'in:', text);
            return { inStock: false, stockStatus: 'Out of Stock' };
          }
        }
      }
    }
    console.log('[DEBUG][WALMART_DEFAULT] No clear OOS indicators, defaulting to in stock');
    return { inStock: true, stockStatus: 'In Stock' };
  });
}

// --- NIKE-SPECIFIC STOCK EXTRACTOR ---
async function extractNikeStock(page: any): Promise<{ inStock: boolean | null, stockStatus: string }> {
  return await page.evaluate(() => {
    function isVisible(el: Element) {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
    }
    // Look for Add to Bag/Add to Cart button
    const btn = Array.from(document.querySelectorAll('button')).find(
      el => el.textContent && /add to bag|add to cart/i.test(el.textContent) && isVisible(el) && !el.disabled
    );
    if (btn) return { inStock: true, stockStatus: 'In Stock' };
    // Look for Sold Out/Out of Stock
    const oos = Array.from(document.querySelectorAll('button, div, span')).find(
      el => el.textContent && /sold out|out of stock/i.test(el.textContent) && isVisible(el)
    );
    if (oos) return { inStock: false, stockStatus: 'Out of Stock' };
    // Default to in stock if unsure
    return { inStock: true, stockStatus: 'In Stock' };
  });
}
// --- END NIKE-SPECIFIC STOCK EXTRACTOR ---

// --- MASTER STOCK EXTRACTOR ---
async function masterExtractStock(page: any): Promise<{ inStock: boolean | null, stockStatus: string }> {
  const scrapeId = Date.now();
  const screenshotPath = path.resolve(__dirname, `../../../debug-stock-extraction-${scrapeId}.png`);
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[DEBUG] Stock extraction screenshot saved: ${screenshotPath}`);
    const url = page.url ? await page.url() : (await page.evaluate(() => window.location.href));
    const domain = url ? (new URL(url)).hostname : '';
    let strategies = [];
    if (domain.includes('apple.')) {
      strategies = [() => extractAppleStock(page)];
    } else if (domain.includes('walmart.')) {
      strategies = [() => extractWalmartStock(page)];
    } else if (domain.includes('nike.')) {
      strategies = [() => extractNikeStock(page)];
    }
    strategies.push(
      async () => await page.evaluate(() => {
        const phrases = [
          'out of stock',
          'unavailable',
          'sold out',
          'currently unavailable',
          'temporarily out of stock'
        ];
        function isVisible(el) {
          return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
        }
        const elements = Array.from(document.querySelectorAll('body, body *'));
        for (const el of elements) {
          if (el && el.textContent && isVisible(el)) {
            const text = el.textContent.toLowerCase();
            for (const phrase of phrases) {
              if (text.includes(phrase)) {
                console.log('[DEBUG][OOS_MATCH]', phrase, 'in:', text, 'visible:', true);
                return { inStock: false, stockStatus: 'Out of Stock' };
              }
            }
          }
        }
        return { inStock: true, stockStatus: 'In Stock' };
      }),
      () => extractAmazonStock(page),
      () => extractEbayStock(page),
      () => extractPlayStationStock(page),
      () => extractSephoraStock(page)
    );
    for (const strategy of strategies) {
      const result = await strategy();
      if (result && result.inStock !== null) {
        console.log(`[DEBUG] Stock extraction result:`, result);
        return result;
      }
    }
    console.log(`[DEBUG] Stock extraction failed - defaulting to in stock`);
    return { inStock: true, stockStatus: 'In Stock' };
  } catch (error) {
    console.error('[DEBUG] Error in stock extraction:', error);
    return { inStock: true, stockStatus: 'In Stock' };
  }
}
// --- END MASTER STOCK EXTRACTOR ---

/**
 * Scrape product details (price, image, stock) in one go for any site.
 * Uses Playwright for Walmart, Puppeteer for others.
 * Returns { price, image, inStock, stockStatus }
 */
export async function scrapeProductDetails(url: string): Promise<{ price: number | string | null, image: string | null, inStock: boolean | null, stockStatus: string }> {
  const domain = new URL(url).hostname;
  const scrapeId = Date.now();
  let context: any = null; // Track Playwright context, always in scope
  let browser: any = null; // Track Puppeteer browser
  let page: any = null;
  let price: number | string | null = null;
  let image: string | null = null;
  let inStock: boolean | null = null;
  let stockStatus: string = 'Unknown';
  
  // Screenshot paths for debugging
  let screenshotPath = path.resolve(__dirname, `../../../debug-screenshot-details-${scrapeId}.png`);
  let playwrightScreenshotPath = path.resolve(__dirname, `../../../debug-playwright-${scrapeId}.png`);
  let puppeteerScreenshotPath = path.resolve(__dirname, `../../../debug-puppeteer-${scrapeId}.png`);
  let finalScreenshotPath = path.resolve(__dirname, `../../../debug-final-${scrapeId}.png`);
  let errorScreenshotPath = path.resolve(__dirname, `../../../debug-error-${scrapeId}.png`);

  // Add random delay before starting to appear more human
  await randomDelay(2000, 5000);

  // Try Puppeteer first for all sites
  let puppeteerSuccess = false;
  let puppeteerResult: { price: number | string | null, image: string | null, inStock: boolean | null, stockStatus: string } = { price: null, image: null, inStock: null, stockStatus: 'Unknown' };

  try {
    console.log(`[PUPPETEER] Attempting to scrape ${domain} with Puppeteer...`);
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--enable-features=NetworkService,NetworkServiceLogging',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--enable-features=NetworkService,NetworkServiceLogging',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-software-rasterizer'
      ],
      executablePath: process.env.CHROME_PATH || undefined,
    });
    page = await browser.newPage();
    // ... all stealth and navigation logic ...
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    // Screenshot after navigation and before extraction
    await page.screenshot({ path: puppeteerScreenshotPath, fullPage: true });
    console.log(`[PUPPETEER] Initial screenshot saved: ${puppeteerScreenshotPath}`);
    await randomDelay(3000, 8000);
    await simulateScrolling(page);
    // Screenshot after scrolling
    const puppeteerScrollScreenshotPath = path.resolve(__dirname, `../../../debug-puppeteer-scroll-${scrapeId}.png`);
    await page.screenshot({ path: puppeteerScrollScreenshotPath, fullPage: true });
    console.log(`[PUPPETEER] Post-scroll screenshot saved: ${puppeteerScrollScreenshotPath}`);
    // Price extraction screenshot
    const puppeteerPriceScreenshotPath = path.resolve(__dirname, `../../../debug-puppeteer-price-${scrapeId}.png`);
    await page.screenshot({ path: puppeteerPriceScreenshotPath, fullPage: true });
    console.log(`[PUPPETEER] Price extraction screenshot saved: ${puppeteerPriceScreenshotPath}`);
    let puppeteerPrice = await masterExtractPrice(page);
    if (puppeteerPrice) {
      const cleaned = (typeof puppeteerPrice === 'string' ? puppeteerPrice : String(puppeteerPrice)).replace(/\s|\u00A0/g, '');
      const match = cleaned.match(/\d+[.,]?\d*/);
      puppeteerPrice = match ? parseFloat(match[0].replace(/,/g, '')) : null;
    }
    // Image extraction screenshot
    const puppeteerImageScreenshotPath = path.resolve(__dirname, `../../../debug-puppeteer-image-${scrapeId}.png`);
    await page.screenshot({ path: puppeteerImageScreenshotPath, fullPage: true });
    console.log(`[PUPPETEER] Image extraction screenshot saved: ${puppeteerImageScreenshotPath}`);
    let puppeteerImage = await masterExtractImage(page);
    // Stock extraction screenshot
    const puppeteerStockScreenshotPath = path.resolve(__dirname, `../../../debug-puppeteer-stock-${scrapeId}.png`);
    await page.screenshot({ path: puppeteerStockScreenshotPath, fullPage: true });
    console.log(`[PUPPETEER] Stock extraction screenshot saved: ${puppeteerStockScreenshotPath}`);
    const puppeteerStockResult = await masterExtractStock(page);
    console.log('[DEBUG] Puppeteer stock result:', puppeteerStockResult);
    let puppeteerInStock = puppeteerStockResult.inStock;
    let puppeteerStockStatus = puppeteerStockResult.stockStatus;
    // Force default if uncertain
    if (puppeteerInStock === null || puppeteerStockStatus === 'Unknown') {
        puppeteerInStock = true;
        puppeteerStockStatus = 'In Stock';
    }
    // Prefer Puppeteer result if it is more complete
    if (puppeteerPrice !== null && puppeteerImage !== null && puppeteerInStock !== null && puppeteerStockStatus !== 'Unknown') {
      puppeteerSuccess = true;
      puppeteerResult = { price: puppeteerPrice, image: puppeteerImage, inStock: puppeteerInStock, stockStatus: puppeteerStockStatus };
      console.log(`[SUCCESS] Puppeteer successfully scraped ${domain} - Price: ${puppeteerPrice}, Image: ${puppeteerImage}, Stock: ${puppeteerStockStatus}`);
      await browser.close();
      return puppeteerResult;
    }
    // Otherwise, store partial Puppeteer result
    puppeteerResult = {
      price: puppeteerPrice !== null ? puppeteerPrice : null,
      image: puppeteerImage !== null ? puppeteerImage : null,
      inStock: puppeteerInStock !== null ? puppeteerInStock : null,
      stockStatus: puppeteerStockStatus !== 'Unknown' ? puppeteerStockStatus : 'Unknown'
    };
    await browser.close();
  } catch (err) {
    console.log(`[FALLBACK] Puppeteer failed for ${domain}, trying Playwright:`, (err as Error).message);
    if (browser) {
      await browser.close();
    }
  }

  // If Puppeteer failed or returned incomplete data, try Playwright
  const needsPlaywright = !puppeteerSuccess || puppeteerResult.price === null || puppeteerResult.image === null || puppeteerResult.inStock === null || puppeteerResult.stockStatus === 'Unknown';
  let playwrightResult: { price: number | string | null, image: string | null, inStock: boolean | null, stockStatus: string } = { price: null, image: null, inStock: null, stockStatus: 'Unknown' };
  if (needsPlaywright) {
    try {
      console.log(`[PLAYWRIGHT] Attempting to scrape ${domain} with Playwright...`);
      const tempProfileDir = path.join(os.tmpdir(), `playwright-profile-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`);
      context = await chromium.launchPersistentContext(tempProfileDir, { headless: false, args: [ '--no-sandbox', '--disable-setuid-sandbox' ] });
      page = (await context.pages())[0] || await context.newPage();
      // Apply stealth techniques
      await setRealisticFingerprintPlaywright(page);
      await bypassBotDetection(page);
      await simulateHumanMouse(page);
      await addRealisticMouseMovements(page);
      await handleStorageRealistically(page);
      await addRealisticExtensions(page);
      await protectWebRTC(page);
      await preventTimingAttacks(page);
      await addAdvancedFingerprintingProtection(page);
      await simulateBrowserStartup(page);
      await addRealisticNetworkBehavior(page);
      await addRealisticFormInteraction(page);
      await addRealisticErrorHandling(page);
      // await addAdvancedAntiDetection(page); // Temporarily disabled due to property redefinition conflicts
      await page.evaluate(() => {
        // Remove automation properties
        delete (window as any).webdriver;
        delete (window as any).selenium;
        delete (window as any).__webdriver_evaluate;
        delete (window as any).__selenium_evaluate;
        delete (window as any).__webdriver_script_fn;
        delete (window as any).__webdriver_script_func;
        delete (window as any).__webdriver_script_func_args;
        delete (window as any).__webdriver_script_obj;
        delete (window as any).__fxdriver_evaluate;
        delete (window as any).__phantom;
        delete (window as any).callPhantom;
        delete (window as any)._phantom;
        delete (window as any).phantom;
        delete (window as any).__nightmare;
        delete (window as any).nightmare;
        delete (window as any).__playwright;
        delete (window as any).__puppeteer;
        (window as any).webdriver = undefined;
        (window as any).selenium = undefined;
        (window as any).automation = undefined;
        let lastActivity = Date.now();
        const updateActivity = () => {
          lastActivity = Date.now();
        };
        ['mousedown', 'mouseup', 'mousemove', 'click', 'scroll', 'keydown', 'keyup'].forEach(eventType => {
          document.addEventListener(eventType, updateActivity, true);
        });
        setInterval(() => {
          if (Date.now() - lastActivity > 30000) {
            const event = new MouseEvent('mousemove', {
              clientX: Math.random() * window.innerWidth,
              clientY: Math.random() * window.innerHeight
            });
            document.dispatchEvent(event);
          }
        }, 5000);
      });
      try {
        console.log(`[PLAYWRIGHT] Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        try {
          await page.screenshot({ path: playwrightScreenshotPath, fullPage: true });
          console.log(`[PLAYWRIGHT] Initial screenshot saved: ${playwrightScreenshotPath}`);
        } catch (screenshotError) {
          console.log(`[WARNING] Could not take Playwright initial screenshot:`, screenshotError);
        }
        await randomDelay(3000, 8000);
        await simulateScrolling(page);
        try {
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`[PLAYWRIGHT] Post-scroll screenshot saved: ${screenshotPath}`);
        } catch (screenshotError) {
          console.log(`[WARNING] Could not take Playwright post-scroll screenshot:`, screenshotError);
        }
        console.log(`[PLAYWRIGHT] Extracting price with master scraper...`);
        price = await masterExtractPrice(page);
        if (price) {
          const cleaned = (typeof price === 'string' ? price : String(price)).replace(/\s|\u00A0/g, '');
          const match = cleaned.match(/\d+[.,]?\d*/);
          price = match ? parseFloat(match[0].replace(/,/g, '')) : null;
        }
        console.log(`[PLAYWRIGHT] Extracting image with master scraper...`);
        image = await masterExtractImage(page);
        console.log(`[PLAYWRIGHT] Extracting stock status with master scraper...`);
        const stockResult = await masterExtractStock(page);
        inStock = stockResult.inStock;
        stockStatus = stockResult.stockStatus;
        try {
          await page.screenshot({ path: finalScreenshotPath, fullPage: true });
          console.log(`[PLAYWRIGHT] Final screenshot saved: ${finalScreenshotPath}`);
        } catch (screenshotError) {
          console.log(`[WARNING] Could not take Playwright final screenshot:`, screenshotError);
        }
        playwrightResult = { price, image, inStock, stockStatus };
        console.log(`[SUCCESS] Playwright successfully scraped ${domain} - Price: ${price}, Image: ${image}, Stock: ${stockStatus}`);
        await context.close();
      } catch (err) {
        console.log(`[FALLBACK] Playwright failed for ${domain}:`, (err as Error).message);
        try {
          if (page) {
            await page.screenshot({ path: errorScreenshotPath, fullPage: true });
            console.log(`[ERROR] Error screenshot saved: ${errorScreenshotPath}`);
          }
        } catch (screenshotError) {
          console.log(`[WARNING] Could not take error screenshot:`, screenshotError);
        }
        await context.close();
      }
    } catch (err) {
      console.log(`[FALLBACK] Playwright launch failed for ${domain}:`, (err as Error).message);
      if (context) {
        await context.close();
      }
    }
  }

  // Prefer Playwright result if it filled any missing field
  const finalResult = {
    price: puppeteerResult.price !== null ? puppeteerResult.price : playwrightResult.price,
    image: puppeteerResult.image !== null ? puppeteerResult.image : playwrightResult.image,
    inStock: puppeteerResult.inStock !== null ? puppeteerResult.inStock : (playwrightResult.inStock !== null ? playwrightResult.inStock : true),
    stockStatus: puppeteerResult.stockStatus !== 'Unknown' ? puppeteerResult.stockStatus : (playwrightResult.stockStatus !== 'Unknown' ? playwrightResult.stockStatus : 'In Stock')
  };

  // Ensure we never return null for inStock - default to true if null
  if (finalResult.inStock === null) {
    finalResult.inStock = true;
    finalResult.stockStatus = 'In Stock';
  }

  return finalResult;
}

// Helper functions for type safety
async function waitForAnyButton(page: any, selector: string) {
  // ... existing code ...
}

async function clickAllButtons(page: any, sel: string) {
  // ... existing code ...
}

async function waitForPriceElement(page: any, selector: string) {
  // ... existing code ...
}

async function waitForStockElement(page: any, sel: string) {
  // ... existing code ...
}

async function waitForStockElementVisible(page: any, sel: string) {
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

// Advanced anti-detection measures for sophisticated bot detection systems
async function addAdvancedAntiDetection(page: any): Promise<void> {
  // @ts-nocheck
  await page.evaluate(() => {
    // 1. Advanced Canvas Fingerprinting Protection
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    (HTMLCanvasElement.prototype as any).getContext = function(contextId: string, options?: any) {
      const context = originalGetContext.call(this, contextId, options);
      if (contextId === '2d' && context) {
        const ctx2d = context as CanvasRenderingContext2D;
        const originalFillText = ctx2d.fillText;
        const originalStrokeText = ctx2d.strokeText;
        const originalGetImageData = ctx2d.getImageData;
        
        // Add noise to text rendering
        ctx2d.fillText = function(text: string, x: number, y: number, maxWidth?: number) {
          const noise = (Math.random() - 0.5) * 0.1;
          return originalFillText.call(this, text, x + noise, y + noise, maxWidth);
        };
        
        ctx2d.strokeText = function(text: string, x: number, y: number, maxWidth?: number) {
          const noise = (Math.random() - 0.5) * 0.1;
          return originalStrokeText.call(this, text, x + noise, y + noise, maxWidth);
        };
        
        // Add noise to image data
        ctx2d.getImageData = function(sx: number, sy: number, sw: number, sh: number) {
          const imageData = originalGetImageData.call(this, sx, sy, sw, sh);
          // Add minimal noise to prevent fingerprinting
          for (let i = 0; i < imageData.data.length; i += 4) {
            const noise = Math.floor((Math.random() - 0.5) * 2);
            imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + noise));
            imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + noise));
            imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + noise));
          }
          return imageData;
        };
      }
      return context;
    };

    // 2. Audio Fingerprinting Protection
    if ((window as any).AudioContext || (window as any).webkitAudioContext) {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const originalGetChannelData = AudioContext.prototype.getChannelData;
      
      AudioContext.prototype.getChannelData = function(channel: number) {
        const channelData = originalGetChannelData.call(this, channel);
        // Add minimal noise to prevent audio fingerprinting
        const noise = new Float32Array(channelData.length);
        for (let i = 0; i < noise.length; i++) {
          noise[i] = (Math.random() - 0.5) * 0.0001;
        }
        return new Float32Array(channelData.map((sample: number, index: number) => sample + noise[index]));
      };
    }

    // 3. Font Fingerprinting Protection
    const originalQuerySelector = document.querySelector;
    document.querySelector = function(selector: string) {
      const element = originalQuerySelector.call(this, selector);
      if (element && selector.includes('font')) {
        // Randomize font metrics slightly
        const style = (element as HTMLElement).style;
        if (style.fontFamily) {
          const fonts = style.fontFamily.split(',');
          const shuffledFonts = fonts.sort(() => Math.random() - 0.5);
          style.fontFamily = shuffledFonts.join(',');
        }
      }
      return element;
    };

    // 4. Hardware Concurrency Randomization
    try {
      if (!Object.getOwnPropertyDescriptor(navigator, 'hardwareConcurrency')) {
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: function() {
            const base = 4;
            const variation = Math.floor(Math.random() * 4) + 2; // 2-6 cores
            return base + variation;
          },
          configurable: true
        });
      }
    } catch (e) {
      // Property already defined, ignore
    }

    // 5. Memory Randomization
    try {
      if (!Object.getOwnPropertyDescriptor(navigator, 'deviceMemory')) {
        Object.defineProperty(navigator, 'deviceMemory', {
          get: function() {
            const memories = [2, 4, 8, 16];
            return memories[Math.floor(Math.random() * memories.length)];
          },
          configurable: true
        });
      }
    } catch (e) {
      // Property already defined, ignore
    }

    // 6. Advanced WebGL Protection
    try {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter: number) {
        // Randomize certain WebGL parameters
        if (parameter === 0x1F00) { // VENDOR
          const vendors = ['Google Inc. (Intel)', 'Google Inc. (NVIDIA)', 'Google Inc. (AMD)', 'Intel Inc.'];
          return vendors[Math.floor(Math.random() * vendors.length)];
        }
        if (parameter === 0x1F01) { // RENDERER
          const renderers = [
            'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0)',
            'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0)',
            'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0)'
          ];
          return renderers[Math.floor(Math.random() * renderers.length)];
        }
        return getParameter.call(this, parameter);
      };
    } catch (e) {
      // Property already defined, ignore
    }

    // 7. Battery API Protection
    try {
      if ((navigator as any).getBattery) {
        const originalGetBattery = (navigator as any).getBattery;
        (navigator as any).getBattery = function() {
          return originalGetBattery.call(this).then((battery: any) => {
            // Randomize battery level
            try {
              if (!Object.getOwnPropertyDescriptor(battery, 'level')) {
                Object.defineProperty(battery, 'level', {
                  get: function() {
                    return Math.random() * 0.8 + 0.2; // 20-100%
                  },
                  configurable: true
                });
              }
            } catch (e) {
              // Property already defined, ignore
            }
            return battery;
          });
        };
      }
    } catch (e) {
      // Property already defined, ignore
    }

    // 8. Connection API Protection
    try {
      if ((navigator as any).connection) {
        const connection = (navigator as any).connection;
        const types = ['wifi', '4g', '3g', '2g'];
        if (!Object.getOwnPropertyDescriptor(connection, 'effectiveType')) {
          Object.defineProperty(connection, 'effectiveType', {
            get: function() {
              return types[Math.floor(Math.random() * types.length)];
            },
            configurable: true
          });
        }
      }
    } catch (e) {
      // Property already defined, ignore
    }

    // 9. Advanced Cookie Protection
    const originalDocumentCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    Object.defineProperty(document, 'cookie', {
      get: function(this: Document) {
        const cookies = originalDocumentCookie?.get?.call(this) || '';
        // Remove tracking cookies
        return cookies.split(';').filter((cookie: string) => {
          const name = cookie.split('=')[0].trim();
          const trackingNames = ['_ga', '_gid', '_fbp', '_fbc', 'analytics', 'tracking'];
          return !trackingNames.some(track => name.includes(track));
        }).join(';');
      },
      set: function(this: Document, value: string) {
        // Block certain tracking cookies
        const name = value.split('=')[0];
        const trackingNames = ['_ga', '_gid', '_fbp', '_fbc', 'analytics', 'tracking'];
        if (!trackingNames.some(track => name.includes(track))) {
          originalDocumentCookie?.set?.call(this, value);
        }
      },
      configurable: true
    });

    // 10. Advanced Storage Protection
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key: string, value: string) {
      const trackingKeys = ['analytics', 'tracking', 'session', 'visitor'];
      if (!trackingKeys.some(track => key.toLowerCase().includes(track))) {
        originalSetItem.call(this, key, value);
      }
    };

    // 11. Request Interception Simulation
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      // Add random headers to make requests look more human
      const modifiedInit = { ...init };
      if (!modifiedInit.headers) {
        modifiedInit.headers = {};
      }
      
      // Add random referrer
      if (Math.random() > 0.5) {
        (modifiedInit.headers as any)['Referer'] = 'https://www.google.com/';
      }
      
      // Add random accept-encoding
      const encodings = ['gzip, deflate, br', 'gzip, deflate', 'br, gzip, deflate'];
      (modifiedInit.headers as any)['Accept-Encoding'] = encodings[Math.floor(Math.random() * encodings.length)];
      
      return originalFetch.call(this, input, modifiedInit);
    };

    // 12. Advanced Timing Attack Prevention
    const originalSetTimeout = window.setTimeout;
    // @ts-ignore
    (window as any).setTimeout = function(callback: (...args: any[]) => void, delay: number) {
      const jitter = (Math.random() - 0.5) * 10; // ±5ms jitter
      const rest = Array.prototype.slice.call(arguments, 2);
      return originalSetTimeout.apply(this, [callback, delay + jitter, ...rest]);
    };

    const originalSetInterval = window.setInterval;
    // @ts-ignore
    (window as any).setInterval = function(callback: (...args: any[]) => void, delay: number) {
      const jitter = (Math.random() - 0.5) * 10; // ±5ms jitter
      const rest = Array.prototype.slice.call(arguments, 2);
      return originalSetInterval.apply(this, [callback, delay + jitter, ...rest]);
    };

    // 13. Behavioral Fingerprinting Protection
    let mouseMoveCount = 0;
    let clickCount = 0;
    let scrollCount = 0;
    
    // Randomize event timing
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) {
      if (type === 'mousemove' || type === 'click' || type === 'scroll') {
        const wrappedListener = function(this: any, event: Event) {
          // Add random delay to event processing
          setTimeout(() => {
            listener.call(this, event);
          }, Math.random() * 50);
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };

    // 14. Advanced Bot Detection Evasion
    // Remove common bot detection properties
    delete (window as any).webdriver;
    delete (window as any).selenium;
    delete (window as any).__webdriver_evaluate;
    delete (window as any).__selenium_evaluate;
    delete (window as any).__webdriver_script_fn;
    delete (window as any).__webdriver_script_func;
    delete (window as any).__webdriver_script_func_args;
    delete (window as any).__webdriver_script_obj;
    delete (window as any).__fxdriver_evaluate;
    delete (window as any).__phantom;
    delete (window as any).callPhantom;
    delete (window as any)._phantom;
    delete (window as any).phantom;
    delete (window as any).__nightmare;
    delete (window as any).nightmare;
    delete (window as any).__playwright;
    delete (window as any).__puppeteer;
    
    // Override navigator properties that bots commonly have - use try-catch to avoid conflicts
    try {
      if (!Object.getOwnPropertyDescriptor(navigator, 'webdriver')) {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
          configurable: true
        });
      }
    } catch (e) {
      // Property already defined, ignore
    }
    
    // Add realistic plugins - only if not already defined
    try {
      if (!Object.getOwnPropertyDescriptor(navigator, 'plugins')) {
        Object.defineProperty(navigator, 'plugins', {
          get: () => {
            const plugins = [
              { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
              { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
              { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
            ];
            return plugins;
          },
          configurable: true
        });
      }
    } catch (e) {
      // Property already defined, ignore
    }
    
    // Add realistic languages - only if not already defined
    try {
      if (!Object.getOwnPropertyDescriptor(navigator, 'languages')) {
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
          configurable: true
        });
      }
    } catch (e) {
      // Property already defined, ignore
    }
    
    // 15. Advanced New Balance Specific Protection
    // Override common New Balance bot detection methods - use try-catch to avoid conflicts
    try {
      (window as any).botDetection = undefined;
      (window as any).isBot = false;
      (window as any).automation = undefined;
    } catch (e) {
      // Properties already defined, ignore
    }
    
    // 16. Amazon-Specific Anti-Detection Measures
    try {
      // Amazon often checks for automation properties
      delete (window as any).__webdriver;
      delete (window as any).__selenium;
      delete (window as any).__webdriver_evaluate;
      delete (window as any).__selenium_evaluate;
      delete (window as any).__webdriver_script_fn;
      delete (window as any).__webdriver_script_func;
      delete (window as any).__webdriver_script_func_args;
      delete (window as any).__webdriver_script_obj;
      delete (window as any).__fxdriver_evaluate;
      delete (window as any).__phantom;
      delete (window as any).callPhantom;
      delete (window as any)._phantom;
      delete (window as any).phantom;
      delete (window as any).__nightmare;
      delete (window as any).nightmare;
      delete (window as any).__playwright;
      delete (window as any).__puppeteer;
      
      // Override common Amazon bot detection methods
      (window as any).webdriver = undefined;
      (window as any).selenium = undefined;
      (window as any).automation = undefined;
      
      // Amazon checks for certain window properties - only if not already defined
      try {
        if (!Object.getOwnPropertyDescriptor(window, 'chrome')) {
          Object.defineProperty(window, 'chrome', {
            get: () => ({
              runtime: {
                id: 'extension_' + Math.random().toString(36).substring(2),
                getManifest: () => ({}),
                sendMessage: () => {},
                onMessage: { addListener: () => {} }
              }
            }),
            configurable: true
          });
        }
      } catch (e) {
        // Property already defined, ignore
      }
      
      // Add realistic permissions - only if not already defined
      try {
        if (!Object.getOwnPropertyDescriptor(navigator, 'permissions')) {
          Object.defineProperty(navigator, 'permissions', {
            get: () => ({
              query: () => Promise.resolve({ state: 'granted' })
            }),
            configurable: true
          });
        }
      } catch (e) {
        // Property already defined, ignore
      }
      
      // Override performance timing for Amazon - only if not already defined
      try {
        if (performance && performance.timing && !Object.getOwnPropertyDescriptor(performance, 'timing')) {
          const originalTiming = performance.timing;
          Object.defineProperty(performance, 'timing', {
            get: () => ({
              ...originalTiming,
              navigationStart: Date.now() - Math.random() * 1000,
              loadEventEnd: Date.now() - Math.random() * 500
            }),
            configurable: true
          });
        }
      } catch (e) {
        // Property already defined, ignore
      }
      
    } catch (e) {
      // Properties already defined, ignore
    }
    
    // Add realistic user behavior patterns
    let lastActivity = Date.now();
    const updateActivity = () => {
      lastActivity = Date.now();
    };
    
    // Monitor and simulate user activity
    ['mousedown', 'mouseup', 'mousemove', 'click', 'scroll', 'keydown', 'keyup'].forEach(eventType => {
      try {
        document.addEventListener(eventType, updateActivity, true);
      } catch (e) {
        // Event listener already exists, ignore
      }
    });
    
    // Simulate periodic activity
    try {
      setInterval(() => {
        if (Date.now() - lastActivity > 30000) { // 30 seconds
          // Simulate micro-movements
          const event = new MouseEvent('mousemove', {
            clientX: Math.random() * window.innerWidth,
            clientY: Math.random() * window.innerHeight
          });
          document.dispatchEvent(event);
        }
      }, 5000);
    } catch (e) {
      // Interval already set, ignore
    }
  });
}