# Stealth Scraper Documentation

## Overview
This enhanced scraper implements comprehensive anti-bot detection techniques to avoid being blocked by websites. It uses multiple layers of stealth technology to mimic human behavior and bypass common detection methods.

## Stealth Features

### 1. Browser Fingerprinting Protection
- **Randomized User Agents**: Rotates between 6 different realistic user agents
- **Dynamic Viewports**: Uses 5 different screen resolutions
- **Language Variations**: Rotates between different language preferences
- **Timezone Randomization**: Uses 5 different timezone settings
- **Geolocation Spoofing**: Sets realistic GPS coordinates

### 2. Advanced Bot Detection Bypass
- **WebDriver Property Removal**: Eliminates automation indicators
- **Chrome Runtime Simulation**: Mimics real Chrome browser extensions
- **Plugin Array Spoofing**: Creates realistic plugin arrays
- **Permissions API Override**: Handles notification permissions realistically
- **Connection API Spoofing**: Simulates realistic network conditions
- **Hardware Concurrency**: Sets realistic CPU core counts
- **Device Memory**: Simulates realistic device memory
- **Touch Points**: Handles touch device detection

### 3. Canvas Fingerprinting Protection
- **WebGL Parameter Override**: Spoofs GPU vendor and renderer information
- **Canvas Context Modification**: Adds slight variations to text rendering
- **Audio Fingerprinting Protection**: Adds noise to audio data

### 4. Human Behavior Simulation
- **Random Delays**: Adds realistic delays between actions (1-8 seconds)
- **Mouse Movement Simulation**: Realistic mouse movement patterns
- **Scrolling Behavior**: Simulates human-like page scrolling
- **Typing Simulation**: Realistic typing with random delays between keystrokes
- **Click Patterns**: Human-like clicking with mouse movement

### 5. Rate Limiting & Request Management
- **Per-Minute Limits**: Maximum 10 requests per minute
- **Per-Hour Limits**: Maximum 100 requests per hour
- **Automatic Backoff**: Waits when limits are reached
- **Random Delays**: Prevents predictable request patterns

### 6. Browser Environment Simulation
- **Cookie Management**: Sets realistic session cookies
- **Local Storage**: Creates realistic browser storage
- **Session Storage**: Simulates session-specific data
- **Extension Simulation**: Mimics browser extension presence

### 7. Network & Headers
- **Realistic Headers**: Sets proper HTTP headers
- **Accept Language**: Rotates language preferences
- **User Agent**: Dynamic user agent rotation
- **Security Headers**: Includes proper security-related headers

### 8. Advanced Browser Arguments
- **Automation Detection Disabled**: `--disable-blink-features=AutomationControlled`
- **Security Features**: Various security and performance optimizations
- **Background Processing**: Disables background throttling
- **GPU Acceleration**: Optimized graphics handling

### 9. WebRTC Protection (NEW)
- **IP Leakage Prevention**: Blocks WebRTC from revealing real IP addresses
- **Media Device Blocking**: Prevents camera/microphone access
- **RTCPeerConnection Override**: Removes IP addresses from SDP data
- **Connection Blocking**: Prevents WebRTC connections

### 10. Timing Attack Prevention (NEW)
- **Performance.now() Jitter**: Adds random variations to timing functions
- **Date.now() Protection**: Prevents precise timing fingerprinting
- **getTime() Override**: Adds jitter to date/time functions
- **Microsecond Precision**: Prevents high-precision timing attacks

### 11. Advanced Fingerprinting Protection (NEW)
- **Battery API Spoofing**: Simulates realistic battery status
- **Device Orientation**: Handles device orientation events
- **Device Motion**: Simulates device motion sensors
- **Screen Orientation**: Sets realistic screen orientation
- **Media Query Timing**: Adds delays to media query responses
- **CSS Fingerprinting**: Prevents CSS-based fingerprinting

### 12. Browser Startup Simulation (NEW)
- **DOMContentLoaded Timing**: Realistic page load timing
- **Load Event Simulation**: Simulates natural page load events
- **Event Dispatching**: Creates realistic browser events
- **Startup Behavior**: Mimics real browser startup patterns

### 13. Network Behavior Simulation (NEW)
- **Fetch API Override**: Adds realistic network timing
- **XMLHttpRequest Timing**: Simulates realistic XHR delays
- **Response Timing**: Varies response times naturally
- **Network Latency**: Simulates real network conditions

### 14. Form Interaction Realism (NEW)
- **Form Submission Delays**: Adds realistic form submission timing
- **Input Event Handling**: Simulates realistic input behavior
- **Focus/Blur Events**: Adds natural focus transitions
- **Form Validation**: Realistic form validation timing

### 15. Error Handling Realism (NEW)
- **Console Error Variation**: Sometimes doesn't log errors (like real browsers)
- **Error Propagation**: Realistic error handling patterns
- **Exception Handling**: Mimics natural browser error behavior
- **Debug Information**: Varies debug output naturally

### 16. TLS & HTTP/2 Fingerprinting (NEW)
- **TLS Cipher Suites**: Realistic TLS configuration
- **Signature Algorithms**: Proper signature algorithm support
- **HTTP/2 Settings**: Realistic HTTP/2 configuration
- **Protocol Support**: Full modern protocol support

## Configuration

### Stealth Configuration Object
```typescript
const STEALTH_CONFIG = {
  userAgents: [...],        // Array of user agents
  viewports: [...],         // Array of viewport sizes
  languages: [...],         // Array of language preferences
  timezones: [...],         // Array of timezone IDs
  proxies: [...],           // Array of proxy servers
  rateLimit: {
    minDelay: 3000,         // Minimum delay between requests
    maxDelay: 8000,         // Maximum delay between requests
    maxRequestsPerMinute: 10,
    maxRequestsPerHour: 100
  },
  advanced: {
    tlsFingerprint: {
      ciphers: [...],       // TLS cipher suites
      sigalgs: [...]        // Signature algorithms
    },
    http2: {
      enablePush: true,
      maxConcurrentStreams: 100,
      initialWindowSize: 65536,
      maxHeaderListSize: 262144
    },
    webrtc: {
      enable: false,        // Disable WebRTC
      blockLocalAddresses: true,
      blockPrivateAddresses: true
    }
  }
};
```

### Adding Proxies
To use proxy rotation, add your proxy servers to the `proxies` array:
```typescript
proxies: [
  'http://username:password@proxy1.com:8080',
  'http://username:password@proxy2.com:8080',
  'socks5://username:password@proxy3.com:1080'
]
```

## Usage

### Basic Usage
The scraper automatically applies all stealth techniques:
```typescript
const result = await scrapeProductDetails('https://example.com/product');
```

### Manual Stealth Application
You can also apply stealth techniques manually:
```typescript
await setRealisticFingerprint(page);
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
await simulateScrolling(page);
```

## Best Practices

### 1. Proxy Rotation
- Use residential proxies for best results
- Rotate proxies frequently
- Use proxies from different geographic locations

### 2. Request Patterns
- Vary request timing
- Don't make requests at regular intervals
- Use realistic delays between requests

### 3. Browser Fingerprinting
- Keep user agents updated
- Use realistic viewport sizes
- Match timezone with geolocation

### 4. Error Handling
- Implement exponential backoff
- Handle CAPTCHA challenges
- Monitor for blocking patterns

### 5. Advanced Protection (NEW)
- **WebRTC**: Always disable WebRTC to prevent IP leakage
- **Timing**: Use jitter to prevent timing-based detection
- **Fingerprinting**: Implement comprehensive fingerprint protection
- **Behavior**: Simulate realistic user behavior patterns

## Monitoring & Debugging

### Rate Limiting Logs
The scraper logs when rate limits are reached:
```
Rate limit reached. Waiting 45000ms before next request.
Hourly rate limit reached. Waiting 1800000ms before next request.
```

### Debug Files
The scraper creates debug files for troubleshooting:
- `debug-screenshot-details-{timestamp}.png`
- `debug-{site}-html-{timestamp}.html`
- `debug-popup-fail.html`

## Advanced Features

### 1. Site-Specific Handling
- **Walmart**: Uses Playwright for enhanced compatibility
- **Sephora**: Special image extraction for SVG elements
- **Amazon**: Optimized price extraction
- **eBay**: Enhanced price pattern matching

### 2. Popup & Modal Handling
- Automatic detection and closing of popups
- Quiz modal handling
- Exit intent modal bypass
- Overlay removal

### 3. Content Extraction
- Master extraction functions for price, image, and stock
- Site-specific fallback extractors
- Robust error handling

### 4. Advanced Stealth Techniques (NEW)
- **WebRTC Protection**: Complete WebRTC IP leakage prevention
- **Timing Attack Prevention**: Comprehensive timing protection
- **Advanced Fingerprinting**: Multi-layered fingerprint protection
- **Behavior Simulation**: Realistic browser behavior patterns
- **Network Realism**: Natural network timing and behavior
- **Form Interaction**: Realistic form handling
- **Error Realism**: Natural error handling patterns

## Troubleshooting

### Common Issues

1. **Blocked by CAPTCHA**
   - Increase delays between requests
   - Use residential proxies
   - Check if user agent is being detected
   - Enable WebRTC protection

2. **Rate Limited**
   - Reduce request frequency
   - Use more proxies
   - Implement exponential backoff
   - Check timing attack prevention

3. **Content Not Loading**
   - Check if JavaScript is enabled
   - Verify network connectivity
   - Review browser arguments
   - Enable advanced fingerprinting protection

4. **IP Leakage (NEW)**
   - Ensure WebRTC protection is enabled
   - Check proxy configuration
   - Verify TLS fingerprinting settings
   - Monitor for WebRTC connections

### Debug Mode
Enable debug mode by setting environment variables:
```bash
DEBUG=true npm start
```

## Security Considerations

1. **Proxy Security**: Use secure proxy connections
2. **Data Privacy**: Don't log sensitive information
3. **Rate Limiting**: Respect website terms of service
4. **Legal Compliance**: Ensure compliance with local laws
5. **IP Protection**: Always use WebRTC protection
6. **Fingerprinting**: Implement comprehensive fingerprint protection

## Performance Optimization

1. **Headless Mode**: Use headless browsers for speed
2. **Resource Limiting**: Disable images and unnecessary resources
3. **Connection Pooling**: Reuse browser instances when possible
4. **Parallel Processing**: Use multiple browser instances for high-volume scraping
5. **Stealth Efficiency**: Balance stealth features with performance

## Future Enhancements

1. **Machine Learning**: Implement ML-based behavior patterns
2. **Advanced Fingerprinting**: More sophisticated fingerprint protection
3. **Distributed Scraping**: Multi-server scraping infrastructure
4. **Real-time Adaptation**: Dynamic adjustment based on detection patterns
5. **AI-Powered Stealth**: AI-driven stealth behavior adaptation
6. **Blockchain Proxies**: Decentralized proxy networks
7. **Quantum-Resistant**: Future-proof against quantum computing attacks 