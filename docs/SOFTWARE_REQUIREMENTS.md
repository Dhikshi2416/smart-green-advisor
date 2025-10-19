# Smart Green Advisor - Software Requirements

## 💻 Development Environment

### 1. Core Development Tools

**Required Software:**
- **Node.js**: 18.x LTS or later
- **npm**: 9.x or later (comes with Node.js)
- **Git**: 2.30+ for version control
- **VS Code**: Latest version (recommended IDE)

**Package Managers:**
```bash
# Primary package manager
npm install

# Alternative package managers
yarn install
pnpm install
```

**Node.js Installation:**
```bash
# Using Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Or download from official website
# https://nodejs.org/en/download/
```

### 2. Development Dependencies

**Build Tools:**
- **Vite**: 5.x - Build tool and dev server
- **TypeScript**: 5.x - Type safety and development
- **ESLint**: 9.x - Code linting and quality
- **Prettier**: 3.x - Code formatting
- **Husky**: 8.x - Git hooks for quality control

**Frontend Dependencies:**
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "@supabase/supabase-js": "^2.75.1",
    "@tanstack/react-query": "^5.83.0",
    "recharts": "^2.15.4",
    "lucide-react": "^0.462.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.11.0",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@types/node": "^22.16.5",
    "typescript": "^5.8.3",
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6"
  }
}
```

### 3. IDE Configuration

**VS Code Extensions (Required):**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

**VS Code Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## 🗄️ Database Requirements

### 1. Supabase (Primary Database)

**PostgreSQL Version:**
- **Version**: PostgreSQL 14+ (managed by Supabase)
- **Extensions**: TimescaleDB for time-series data
- **Storage**: 100GB+ for production
- **Backup**: Daily automated backups
- **Replication**: Read replicas for performance

**Database Configuration:**
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Configure connection pooling
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
```

**Required Tables:**
```sql
-- Core application tables
CREATE TABLE profiles (...);
CREATE TABLE user_devices (...);
CREATE TABLE solar_panels (...);
CREATE TABLE device_consumption_history (...);
CREATE TABLE energy_analytics (...);
CREATE TABLE weather_data (...);
```

### 2. Redis Cache (Optional)

**Redis Configuration:**
- **Version**: Redis 6+ or Redis 7+
- **Memory**: 2GB+ for real-time data
- **Persistence**: RDB + AOF for data durability
- **Clustering**: For high availability (optional)

**Redis Setup:**
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Key configurations
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 🌐 Web Server Requirements

### 1. Production Server

**Minimum Requirements:**
- **OS**: Ubuntu 20.04 LTS or later
- **CPU**: 4 cores (2.4GHz+)
- **RAM**: 8GB DDR4
- **Storage**: 100GB SSD
- **Network**: 1Gbps connection

**Recommended Configuration:**
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 8 cores (3.0GHz+)
- **RAM**: 16GB DDR4
- **Storage**: 500GB NVMe SSD
- **Network**: 10Gbps connection

### 2. Web Server Software

**Nginx (Recommended):**
```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Configuration
sudo nano /etc/nginx/sites-available/smart-green-advisor

# Basic configuration
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Apache (Alternative):**
```bash
# Install Apache
sudo apt install apache2

# Enable modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
```

### 3. SSL/TLS Configuration

**Let's Encrypt (Free SSL):**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

**Commercial SSL (Optional):**
- **DigiCert**: Enterprise-grade SSL
- **Comodo**: Budget-friendly option
- **GlobalSign**: High-assurance certificates

## 🔧 Runtime Environment

### 1. Node.js Runtime

**Production Setup:**
```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be 18.x+
npm --version   # Should be 9.x+
```

**Process Management:**
```bash
# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# Auto-start on boot
pm2 startup
pm2 save
```

**PM2 Configuration:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'smart-green-advisor',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 2. Environment Variables

**Required Environment Variables:**
```bash
# Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# External APIs
OPENWEATHER_API_KEY=your-weather-api-key
ELECTRICITY_PRICING_API_KEY=your-pricing-api-key

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
```

**Environment File Structure:**
```
.env.local          # Local development
.env.development    # Development environment
.env.staging        # Staging environment
.env.production     # Production environment
```

## 📱 Mobile Development

### 1. React Native (Future)

**Development Setup:**
```bash
# Install React Native CLI
npm install -g @react-native-community/cli

# Install Expo CLI (alternative)
npm install -g @expo/cli

# Create new project
npx react-native init SmartGreenAdvisor
```

**Required Dependencies:**
```json
{
  "dependencies": {
    "react-native": "^0.72.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "react-native-ble-plx": "^3.0.0",
    "react-native-wifi-reborn": "^4.13.0",
    "@supabase/supabase-js": "^2.75.1"
  }
}
```

### 2. Progressive Web App (PWA)

**PWA Configuration:**
```json
// manifest.json
{
  "name": "Smart Green Advisor",
  "short_name": "SGA",
  "description": "Real-time energy management",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

**Service Worker:**
```javascript
// sw.js
const CACHE_NAME = 'smart-green-advisor-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

## 🔒 Security Requirements

### 1. Authentication & Authorization

**Supabase Auth Configuration:**
```javascript
// supabase/config.js
export const supabaseConfig = {
  url: process.env.VITE_SUPABASE_URL,
  anonKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
};
```

**JWT Configuration:**
```javascript
// jwt.config.js
export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',
  algorithm: 'HS256',
  issuer: 'smart-green-advisor',
  audience: 'smart-home-users'
};
```

### 2. Data Encryption

**Encryption Setup:**
```javascript
// encryption.js
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('smart-green-advisor'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}
```

### 3. API Security

**Rate Limiting:**
```javascript
// rate-limit.js
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many requests, please try again later'
});
```

**CORS Configuration:**
```javascript
// cors.js
import cors from 'cors';

export const corsOptions = {
  origin: [
    'https://smart-green-advisor.vercel.app',
    'https://your-domain.com',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

## 📊 Monitoring & Logging

### 1. Application Monitoring

**Sentry Integration:**
```javascript
// sentry.js
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ]
});
```

**Custom Logging:**
```javascript
// logger.js
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### 2. Performance Monitoring

**Web Vitals:**
```javascript
// vitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## 🚀 Deployment Requirements

### 1. Cloud Deployment

**Vercel (Frontend):**
```json
// vercel.json
{
  "builds": [
    {
      "src": "dist/index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_PUBLISHABLE_KEY": "@supabase-key"
  }
}
```

**Railway/Heroku (Backend):**
```json
// package.json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc && vite build",
    "dev": "vite dev"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

### 2. Docker Deployment

**Dockerfile:**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=smart_green_advisor
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 📋 Installation Checklist

### 1. Development Setup

**Initial Setup:**
- [ ] Install Node.js 18.x LTS
- [ ] Install Git and VS Code
- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Set up environment variables
- [ ] Configure Supabase project
- [ ] Run development server (`npm run dev`)

**Database Setup:**
- [ ] Create Supabase project
- [ ] Run database migrations
- [ ] Set up Row Level Security (RLS)
- [ ] Configure authentication
- [ ] Test database connections

**External Services:**
- [ ] Set up weather API account
- [ ] Configure electricity pricing API
- [ ] Set up monitoring services
- [ ] Configure alert notifications

### 2. Production Deployment

**Server Preparation:**
- [ ] Set up Ubuntu server
- [ ] Install Node.js and PM2
- [ ] Configure Nginx
- [ ] Set up SSL certificates
- [ ] Configure firewall rules

**Application Deployment:**
- [ ] Build production bundle
- [ ] Deploy to server
- [ ] Configure environment variables
- [ ] Set up process monitoring
- [ ] Configure log rotation

**Security Hardening:**
- [ ] Enable firewall
- [ ] Configure fail2ban
- [ ] Set up intrusion detection
- [ ] Configure backup systems
- [ ] Test security measures

This comprehensive software requirements guide ensures proper setup and deployment of the Smart Green Advisor system with all necessary tools, dependencies, and configurations for optimal performance and security.
