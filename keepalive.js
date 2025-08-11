// Keep-alive script to prevent Render from sleeping
// Run this on your computer to keep the service warm

const https = require('https');

const BACKEND_URL = 'https://moloco-crm-backend.onrender.com';
const INTERVAL = 14 * 60 * 1000; // 14 minutes (Render sleeps after 15 min)

function pingServer() {
    const now = new Date().toISOString();
    console.log(`[${now}] 🏓 Pinging ${BACKEND_URL}/keepalive...`);
    
    https.get(`${BACKEND_URL}/keepalive`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log(`[${now}] ✅ Server alive: ${response.status}`);
            } catch (e) {
                console.log(`[${now}] ✅ Server responded (non-JSON)`);
            }
        });
    }).on('error', (err) => {
        console.error(`[${now}] ❌ Ping failed:`, err.message);
    });
}

console.log('🚀 Starting Render keep-alive service...');
console.log(`📡 Will ping ${BACKEND_URL} every 14 minutes`);
console.log('💡 Keep this running to prevent cold starts!');
console.log('');

// Initial ping
pingServer();

// Set up interval
setInterval(pingServer, INTERVAL);
