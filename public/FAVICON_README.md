# RTSE Sales Helper - Favicon Setup

This directory contains the favicon and Apple Touch Icon files for the RTSE Sales Helper application.

## Files Included

### Favicon Files
- `favicon.ico` - Placeholder ICO file (needs conversion)
- `favicon.svg` - Vector favicon with RTSE branding
- `favicon.html` - HTML generator for creating PNG favicon

### Apple Touch Icons (iOS Home Screen)
- `apple-touch-icon-180x180.svg` - Modern iOS devices
- `apple-touch-icon-152x152.svg` - iPad
- `apple-touch-icon-120x120.svg` - iPhone
- `apple-touch-icon-76x76.svg` - Legacy devices

### PWA Support
- `manifest.json` - Web app manifest for PWA features

## Converting to Production Formats

### For favicon.ico
1. **Online Converters:**
   - Visit [favicon.io](https://favicon.io/favicon-converter/)
   - Upload the `favicon.svg` file
   - Download the generated ICO file
   - Replace the placeholder `favicon.ico`

2. **Using ImageMagick:**
   ```bash
   convert favicon.svg favicon.ico
   ```

3. **Using the HTML Generator:**
   - Open `favicon.html` in a browser
   - Click "Download Favicon" to get PNG
   - Convert PNG to ICO using online tools

### For Apple Touch Icons
1. **Convert SVG to PNG:**
   ```bash
   # Using ImageMagick
   convert apple-touch-icon-180x180.svg apple-touch-icon-180x180.png
   convert apple-touch-icon-152x152.svg apple-touch-icon-152x152.png
   convert apple-touch-icon-120x120.svg apple-touch-icon-120x120.png
   convert apple-touch-icon-76x76.svg apple-touch-icon-76x76.png
   ```

2. **Online SVG to PNG converters:**
   - [Convertio](https://convertio.co/svg-png/)
   - [CloudConvert](https://cloudconvert.com/svg-to-png)

## Design Details

### Color Scheme
- **Background:** RTSE Red (#ED1C24)
- **Text:** RTSE Yellow (#FFD700)
- **Rounded corners** for modern look

### Typography
- **Font:** Arial, sans-serif
- **Weight:** Bold
- **Layout:** Vertical stacking of "R", "T", "SE"

## Browser Support

- **Modern browsers:** SVG favicon support
- **Legacy browsers:** ICO file fallback
- **iOS Safari:** Apple Touch Icons for home screen
- **Android Chrome:** PWA manifest support

## Testing

1. **Browser tabs:** Should show RTSE favicon
2. **Bookmarks:** Should display custom icon
3. **iOS home screen:** Add to home screen should show RTSE icon
4. **Android:** Should show in app drawer when installed as PWA

## Notes

- SVG files provide crisp scaling at any size
- ICO file is required for maximum browser compatibility
- Apple Touch Icons should be PNG for best iOS support
- Manifest.json enables PWA features like "Add to Home Screen"

