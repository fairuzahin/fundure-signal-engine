// server.js
// This is the backend server for your Real-Time Signal DNA Dashboard.
// To run this:
// 1. Make sure you have Node.js installed.
// 2. In your terminal, run `npm install express socket.io` to install the necessary libraries.
// 3. Run this file with `node server.js`.

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

// --- Configuration ---
const PORT = process.env.PORT || 3000;
// This is your secret key from the Finnhub webhook dashboard.
const FINNHUB_WEBHOOK_SECRET = 'd191k8hr01qkcat5gi2g'; 

// --- Server Setup ---
const app = express();
const server = http.createServer(app);
// Initialize Socket.IO for real-time communication with the frontend
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from any origin for demonstration
    methods: ["GET", "POST"]
  }
});

// Middleware to parse incoming JSON payloads from Finnhub
app.use(express.json());


// --- Webhook Endpoint ---
// This is the URL you will provide to Finnhub (e.g., https://your-server-domain.com/webhook/finnhub)
app.post('/webhook/finnhub', (req, res) => {
    // 1. Verify the request is legitimate using the secret key
    const finnhubSecret = req.get('X-Finnhub-Secret');
    if (finnhubSecret !== FINNHUB_WEBHOOK_SECRET) {
        console.warn('Unauthorized webhook attempt detected.');
        return res.status(401).send('Unauthorized');
    }

    // 2. Acknowledge receipt of the webhook immediately
    // Finnhub requires a fast 2xx response to prevent timeouts.
    res.status(200).send('Acknowledged');

    // 3. Process the event payload asynchronously
    const eventData = req.body;
    console.log('Received event from Finnhub:', JSON.stringify(eventData, null, 2));

    if (eventData.type === 'news') {
        processNewsEvent(eventData.data);
    }
    // You can add more event types here, e.g., 'earnings', 'ipo', etc.
});


// --- Analysis Engine (Placeholder) ---
function processNewsEvent(newsArticles) {
    // This is where your preset analytical rules will live.
    // For now, it's a placeholder. In a real system, you would:
    // a. Analyze the headline/summary for keywords (e.g., "inflation", "geopolitical", "rate cut").
    // b. Determine which instrument(s) are affected.
    // c. Apply your rules to generate a new Signal, Conviction Score, and DNA.
    // d. Broadcast the update to all connected frontend clients.

    const headline = newsArticles[0].headline;
    console.log(`Processing news headline: "${headline}"`);
    
    // ---!!!---
    // ---!!! Placeholder Logic: In a real system, your analysis would go here ---!!!
    // For this example, let's hardcode an update for Gold (XAU) if the news is about geopolitics.
    
    let updatePayload = null;

    if (headline.toLowerCase().includes('geopolitical') || headline.toLowerCase().includes('conflict')) {
        updatePayload = {
            instrument: 'XAU',
            newData: {
                signal: 'STRONG BUY',
                conviction: 9,
                dna: [20, 70, 10], // High macro/geopolitical influence
                analysis: `Signal updated due to breaking news: "${headline}". A major geopolitical flare-up creates a powerful flight-to-safety bid.`
            }
        };
    }
    
    if (headline.toLowerCase().includes('inflation') || headline.toLowerCase().includes('cpi')) {
         updatePayload = {
            instrument: 'US10Y',
            newData: {
                signal: 'SELL',
                conviction: 8,
                dna: [20, 70, 10], 
                analysis: `Signal updated due to breaking news: "${headline}". Higher inflation means the Fed will likely keep rates higher for longer, causing yields to rise.`
            }
        };
    }

    // --- Broadcast the update ---
    if (updatePayload) {
        console.log(`Broadcasting update for ${updatePayload.instrument}`);
        io.emit('signal-update', updatePayload);
    }
}


// --- WebSocket Connection Handling ---
io.on('connection', (socket) => {
  console.log('A user connected to the dashboard.');
  
  socket.on('disconnect', () => {
    console.log('User disconnected.');
  });
});


// --- Start Server ---
server.listen(PORT, () => {
    console.log(`Backend Analysis Engine is running on http://localhost:${PORT}`);
    console.log('Listening for webhooks at /webhook/finnhub');
});
