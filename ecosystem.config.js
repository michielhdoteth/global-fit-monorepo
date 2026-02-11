/**
 * PM2 Ecosystem Configuration
 * Multi-tenant WhatsApp Receptionist
 */

module.exports = {
  apps: [
    // Brain API (Multi-tenant)
    {
      name: 'brain-api',
      script: './shared/brain-api/index.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        BRAIN_API_PORT: 3000
      },
      error_file: './logs/brain-api-error.log',
      out_file: './logs/brain-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    
    // Client A Gateway
    {
      name: 'client-a-gateway',
      script: './client-a/whatsapp-gateway/gateway.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 2900,
        CLIENT_ID: 'client-a'
      },
      error_file: './logs/client-a-gateway-error.log',
      out_file: './logs/client-a-gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    
    // Client B Gateway
    {
      name: 'client-b-gateway',
      script: './client-b/whatsapp-gateway/gateway.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 2901,
        CLIENT_ID: 'client-b'
      },
      error_file: './logs/client-b-gateway-error.log',
      out_file: './logs/client-b-gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    
    // Client C Gateway
    {
      name: 'client-c-gateway',
      script: './client-c/whatsapp-gateway/gateway.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 2902,
        CLIENT_ID: 'client-c'
      },
      error_file: './logs/client-c-gateway-error.log',
      out_file: './logs/client-c-gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    
    // Connection Watcher
    {
      name: 'connection-watcher',
      script: './shared/monitoring/connection-watcher.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/connection-watcher-error.log',
      out_file: './logs/connection-watcher-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
