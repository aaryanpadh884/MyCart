# Item Tracker

A web application for tracking product prices and organizing items into folders.

## Features

### Product Tracking
- **Automatic Price Tracking**: Add product URLs to automatically scrape and track prices
- **Manual Product Entry**: Add products manually with custom names, prices, and images
- **Price History**: View when prices were last checked
- **Real-time Price Updates**: Check current prices with a single click

### Folder Organization
- **Create Folders**: Organize products into custom folders (e.g., "Clothes", "Electronics")
- **Custom Colors**: Assign unique colors to folders for easy identification
- **Move Products**: Drag and drop products between folders or remove them from folders
- **Folder Management**: Edit folder names, descriptions, and colors
- **Visual Indicators**: Products display their folder name and color for quick identification

### User Interface
- **Modern Design**: Clean, responsive interface with product cards
- **Tab Navigation**: Separate tabs for tracked and manually added products
- **Folder Display**: Visual folder management section with color-coded folders
- **Modal Dialogs**: Intuitive folder creation and editing interface

### Price & Stock Monitoring
- **Daily Automatic Updates**: Daily automatic updates at 9:00 AM EST
- **Email Notifications**: Get notified when prices or stock status changes (for products with notifications enabled)
- **Real-time Updates**: Manual refresh of individual products or all products at once

## Notification System

The application includes a notification system that allows users to subscribe to price and stock change alerts:

### How to Enable Notifications

1. **Hover over any product card** - A notification icon will appear in the top-left corner
2. **Click the notification icon** - This toggles notifications on/off for that specific product
3. **Visual Feedback**:
   - **Bright icon with glow effect**: Notifications are enabled
   - **Dimmed icon**: Notifications are disabled
4. **Tooltip**: Hover over the icon to see the current status

### Notification Behavior

- **Daily Updates**: The system checks all products daily at 9:00 AM EST
- **Email Alerts**: Only products with notifications enabled will trigger email alerts
- **Change Detection**: Notifications are sent when:
  - Price changes (if price notifications are enabled)
  - Stock status changes (if stock notifications are enabled)
- **Email Content**: Includes the product name, old value, and new value

### Email Setup

To receive email notifications, configure the following environment variables in your `.env` file:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
NOTIFICATION_EMAIL=your-email@gmail.com
```

**Note**: Use an App Password, not your main Gmail password. You can generate one in your Google Account settings.

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **TypeScript** for type safety
- **Web Scraping** for automatic price extraction
- **Cron Jobs** for automated daily price updates

### Frontend
- **React** with TypeScript
- **Vite** for fast development and building
- **Modern CSS** with inline styles for maintainability

## API Endpoints

### Products
- `POST /api/submit` - Add a new tracked product
- `GET /api/products` - Get all tracked products
- `PUT /api/products/:id/folder` - Move product to folder
- `DELETE /api/products/:id` - Delete tracked product

### Manual Products
- `POST /api/manual-products` - Add a manual product
- `GET /api/manual-products` - Get all manual products
- `PUT /api/manual-products/:id/folder` - Move manual product to folder
- `DELETE /api/manual-products/:id` - Delete manual product

### Folders
- `POST /api/folders` - Create a new folder
- `GET /api/folders` - Get all folders
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder (moves products to "No Folder")

## Getting Started

1. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd frontend
   npm install
   ```

2. **Start MongoDB**
   Make sure MongoDB is running on `localhost:27017`

3. **Start the Application**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm start
   
   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

## Usage

### Creating Folders
1. Click "Create Folder" in the folder management section
2. Enter a folder name (required)
3. Optionally add a description and choose a color
4. Click "Create"

### Adding Products to Folders
1. When adding a product (tracked or manual), select a folder from the dropdown
2. Or move existing products to folders using the dropdown on each product card

### Managing Folders
- **Edit**: Click the pencil icon on any folder
- **Delete**: Click the trash icon on any folder (products will be moved to "No Folder")

### Organizing Products
- Use the folder dropdown on each product card to move products between folders
- Products display their folder name and color for easy identification
- Products without folders show "No Folder" in the dropdown

## Database Schema

### Folder
```typescript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  color: String (default: '#007bff'),
  createdAt: Date,
  updatedAt: Date
}
```

### Product
```typescript
{
  _id: ObjectId,
  url: String (required),
  name: String,
  price: Number,
  lastChecked: Date,
  createdAt: Date,
  image: String,
  folderId: ObjectId (ref: 'Folder')
}
```

### ManualProduct
```typescript
{
  _id: ObjectId,
  name: String (required),
  url: String (required),
  price: Number (required),
  createdAt: Date,
  image: String,
  folderId: ObjectId (ref: 'Folder')
}
``` 