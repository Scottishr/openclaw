
#!/usr/bin/env node
require('dotenv').config();

const express = require('express');
const crypto = require('crypto');
const process = require('process');
const axios = require('axios'); // For making HTTP requests

const app = express();
const port = process.env.PORT || 3000;
const GITHUB_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// ----- Helper Functions -----

// Function to send a Telegram message
async function sendTelegramMessage(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
        console.warn("Telegram bot token or channel ID not set. Skipping Telegram notification.");
        return;
    }
    try {
        console.log(`Sending Telegram alert to ${TELEGRAM_CHANNEL_ID}...`);
        await axios.post(TELEGRAM_API_URL, {
            chat_id: TELEGRAM_CHANNEL_ID,
            text: message,
            parse_mode: 'Markdown' // Or 'HTML' if needed
        });
        console.log("Telegram alert sent successfully.");
    } catch (error) {
        console.error("Error sending Telegram message:", error.message);
    }
}

// Function to clean up URL-unsafe characters for Telegram
function urlEncodeMessage(message) {
    return encodeURIComponent(message);
}

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to verify GitHub webhook signature
const verifyGitHubSignature = (req, res, proceed) => {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        console.warn("Warning: No X-Hub-Signature-256 header received. Skipping signature verification.");
        proceed();
        return;
    }

    if (!GITHUB_SECRET) {
        console.warn("Warning: GITHUB_WEBHOOK_SECRET is not set. Skipping signature verification.");
        proceed();
        return;
    }

    const hmac = crypto.createHmac('sha256', GITHUB_SECRET);
    hmac.update(JSON.stringify(req.body));
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    if (signature !== expectedSignature) {
        console.error("GitHub signature verification failed!");
        return res.status(401).send("Invalid signature.");
    }

    proceed();
};

// Apply signature verification to relevant routes
app.post('/webhook', verifyGitHubSignature, (req, res) => {
    const eventType = req.headers['x-github-event'];
    console.log(`Received GitHub event: ${eventType}`);

    // --- Event Handling Logic ---
    if (eventType === 'push') {
        console.log('Push event detected.');
        const repo = req.body.repository;
        const pusher = req.body.pusher;
        const message = `🚀 Push detected on ${repo.full_name} by ${pusher.name}. Branch: ${req.body.ref}`;
        sendTelegramMessage(message);
    } else if (eventType === 'pull_request') {
        console.log('Pull Request event detected.');
        const repo = req.body.repository;
        const pr = req.body.pull_request;
        const action = req.body.action; // opened, closed, reopened, synchronize

        let message = `PR Update on ${repo.full_name}: #${pr.number} "${pr.title}" (${action})`;
        if (action === 'opened') message += `\nOpened by: ${pr.user.login}`;
        if (action === 'closed' && pr.merged) message += `\nMerged by: ${pr.merged_by.login}`;
        if (action === 'closed' && !pr.merged) message += `\nClosed without merging`;

        sendTelegramMessage(message);

    } else if (eventType === 'check_run') {
        console.log('Check Run event detected.');
        const repo = req.body.repository;
        const check_run = req.body.check_run;
        
        if (check_run && check_run.status === 'completed' && check_run.conclusion === 'failure') {
            const message = `🚨 CI Failure on ${repo.full_name}\nJob: "${check_run.name}" failed for commit ${check_run.head_sha.substring(0, 7)}.`;
            sendTelegramMessage(message);
        }
    } else {
        console.log(`Ignoring unhandled event type: ${eventType}`);
    }

    res.status(200).send({ message: `Event ${eventType} received.`, status: 'processed' });
});

// Basic root route
app.get('/', (req, res) => {
    res.send("Webhook server is running. Send POST requests to /webhook");
});

app.listen(port, () => {
    console.log(`Webhook server listening at http://localhost:${port}`);
});

// --- Error Handling ---
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // In a real scenario, log to ~/.openclaw/error-memory.json
    // For now, just log to console
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // In a real scenario, log to ~/.openclaw/error-memory.json
    // For now, just log to console
    process.exit(1);
});
