const cron = require('node-cron');
const axios = require('axios');
const BOT_TOKEN = '8587301280:AAEVDS5d2gS1bYwIak90AUq1pScc3zHFX2M';
const CHAT_ID = '7722253371';
async function sendTelegram(msg) {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {chat_id: CHAT_ID, text: msg});
    console.log('✅ Sent:', msg);
  } catch(e) { console.error('❌ Failed:', e.message); }
}
setTimeout(() => sendTelegram('🦞 Scheduler is alive!'), 10000);
cron.schedule('0 7 * * *', () => sendTelegram('☀️ Morning Scott! Daily briefing time.'));
cron.schedule('0 * * * *', () => sendTelegram('📊 Hourly check — all systems running.'));
console.log('✅ Scheduler started — message in 10 seconds...');
