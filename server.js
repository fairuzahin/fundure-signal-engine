// server.js
// This is the FINAL backend server code for your Real-Time Signal DNA Dashboard.
// It connects to the LIVE Finnhub news stream.

// --- Instructions ---
// 1. Replace the existing `server.js` in your GitHub repository with this file's content.
// 2. You will need to add the 'ws' library. In your Render.com service settings,
//    ensure your "Build Command" is `npm install ws`. Or, if you run locally,
//    run `npm install express socket.io ws`.
// 3. Redeploy your service on Render. It will now use live data.

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const WebSocket = require('ws'); // Library for connecting to WebSockets

// --- Configuration ---
const PORT = process.env.PORT || 3000;
// These are your credentials from the Finnhub dashboard.
const FINNHUB_API_KEY = 'd191k8hr01qkcat5gi2g';
const FINNHUB_WEBHOOK_SECRET = 'd191k8hr01qkcat5gi2g'; 

// --- Server Setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allows your WordPress site to connect
    methods: ["GET", "POST"]
  }
});
app.use(express.json());

// --- Webhook Endpoint (for other potential events) ---
app.post('/webhook/finnhub', (req, res) => {
    const finnhubSecret = req.get('X-Finnhub-Secret');
    if (finnhubSecret !== FINNHUB_WEBHOOK_SECRET) {
        return res.status(401).send('Unauthorized');
    }
    res.status(200).send('Acknowledged');
    // You could process other Finnhub webhooks here if needed
});


// --- Live Finnhub Connection ---
const finnhubSocket = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);

// 1. On successful connection...
finnhubSocket.on('open', () => {
  console.log('Successfully connected to Finnhub WebSocket for LIVE news.');
  // Subscribe to the general news category
  finnhubSocket.send(JSON.stringify({'type':'subscribe-news','symbol': 'general'}));
});

// 2. When a message (a news event) is received from Finnhub...
finnhubSocket.on('message', (data) => {
  try {
    const eventData = JSON.parse(data);
    if (eventData.type === 'news' && eventData.data) {
        console.log('Received LIVE news from Finnhub:');
        console.log(JSON.stringify(eventData.data, null, 2));
        // Trigger the analysis engine with the new live data
        processNewsEvent(eventData.data);
    }
  } catch (error) {
    console.error('Error processing message from Finnhub:', error);
  }
});

finnhubSocket.on('error', (error) => {
    console.error('Finnhub WebSocket error:', error);
});

// --- Analysis Engine ---
function processNewsEvent(newsArticles) {
    // This function applies your preset analytical rules to the live news.
    const headline = newsArticles[0].headline;
    console.log(`Analyzing headline: "${headline}"`);
    
    let updatePayload = null;
    const lowerCaseHeadline = headline.toLowerCase();

    // --- Rule-Based Analysis Examples ---
    // You can make these rules as complex as you need.

    // Rule 1: Geopolitical Tension -> Affects Gold (XAU)
    if (lowerCaseHeadline.includes('geopolitical') || lowerCaseHeadline.includes('conflict') || lowerCaseHeadline.includes('tensions')) {
        updatePayload = {
            instrument: 'XAU',
            newData: {
                signal: 'STRONG BUY',
                conviction: 9,
                dna: [20, 70, 10], // High macro/geopolitical influence
                analysis: `Signal updated on breaking news: "${headline}". Major geopolitical events create a powerful flight-to-safety bid for gold.`
            }
        };
    }

    // Rule 2: Inflation/CPI News -> Affects Treasuries (US10Y)
    else if (lowerCaseHeadline.includes('inflation') || lowerCaseHeadline.includes('cpi') || lowerCaseHeadline.includes('consumer price')) {
         updatePayload = {
            instrument: 'US10Y',
            newData: {
                signal: 'SELL',
                conviction: 8,
                dna: [20, 70, 10], 
                analysis: `Signal updated on economic data: "${headline}". Hotter inflation data implies the Fed will remain hawkish, putting downward pressure on bond prices (and raising yields).`
            }
        };
    }
    
    // Rule 3: Federal Reserve / FOMC News -> Affects S&P 500 (SPX)
    else if (lowerCaseHeadline.includes('fed') || lowerCaseHeadline.includes('fomc') || lowerCaseHeadline.includes('rate cut')) {
         updatePayload = {
            instrument: 'SPX',
            newData: {
                signal: 'BUY',
                conviction: 7,
                dna: [30, 60, 10], 
                analysis: `Signal updated on Fed news: "${headline}". Dovish signals from the Fed boost investor sentiment and increase appetite for risk assets like stocks.`
            }
        };
    }

    // Broadcast the update to all connected frontends
    if (updatePayload) {
        console.log(`Broadcasting signal update for ${updatePayload.instrument}`);
        io.emit('signal-update', updatePayload);
    }
}

// --- WebSocket Connection Handling with Frontend Clients ---
io.on('connection', (socket) => {
  console.log('A user connected to the dashboard.');
  socket.on('disconnect', () => {
    console.log('User disconnected.');
  });
});

// --- Start Server ---
server.listen(PORT, () => {
    console.log(`Backend Analysis Engine is running on http://localhost:${PORT}`);
    console.log('Connecting to Finnhub for live data...');
});
