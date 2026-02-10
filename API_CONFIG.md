# Ambiora Tech Fest - Environment Configuration

## Backend API Configuration

The application automatically detects the environment and uses the correct backend URL:

### Development (localhost)
- **Backend URL**: `http://localhost:3001`
- **When**: Running on `localhost` or `127.0.0.1`
- **Usage**: Start backend server with `npm run server`

### Production (Vercel)
- **Backend URL**: `https://ambiora-techfest.vercel.app`
- **When**: Deployed to any other domain
- **Usage**: Automatically uses production backend

## Configuration File

Located at: `src/config/api.js`

```javascript
import { API_CONFIG } from './config/api.js';

// Get API base URL
const baseUrl = API_CONFIG.BASE_URL;

// Get full API URL
const apiUrl = API_CONFIG.API_URL;

// Make API calls
fetch(`${API_CONFIG.API_URL}/auth/login`, { ... });
```

## Files Using API Configuration

All API calls go through the centralized configuration:

1. **`src/config/api.js`** - Main configuration file
2. **`src/utils/auth.js`** - Authentication (login, signup, logout)
3. **`src/services/cashfree.js`** - Payment processing
4. **`src/pages/*.js`** - Page-specific scripts (login, signup, checkout, etc.)

## Environment Detection Logic

```javascript
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

const BASE_URL = isDevelopment 
  ? 'http://localhost:3001' 
  : 'https://ambiora-techfest.vercel.app';
```

## Testing

### Local Development
1. Start backend: `npm run server`
2. Open frontend: `http://localhost:5173`
3. API calls will go to: `http://localhost:3001/api/*`

### Production
1. Deploy frontend to Vercel/Netlify/other
2. API calls will automatically go to: `https://ambiora-techfest.vercel.app/api/*`

## No Manual Configuration Needed!

✅ The system automatically detects the environment  
✅ No need to change code when deploying  
✅ Works seamlessly in both development and production  

## Debugging

To see which environment is being used:

```javascript
import { API_CONFIG } from './src/config/api.js';

// Check current configuration
console.log('Environment:', API_CONFIG.isDevelopment ? 'Development' : 'Production');
console.log('Backend URL:', API_CONFIG.BASE_URL);
console.log('API URL:', API_CONFIG.API_URL);
```

Or simply check the browser console - in development mode, the configuration is automatically logged.
