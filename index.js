import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Tell Puppeteer to use the stealth plugin to bypass Cloudflare
puppeteer.use(StealthPlugin());

const url = process.argv[2];

if (!url) {
  console.error("❌ Please provide a Slack invite URL.");
  console.log("Usage: node index.js <YOUR_URL>");
  process.exit(1);
}

async function checkSlackInvite(targetUrl) {
  // Launching browser. If it still fails, you can temporarily change
  // headless to false to visually see what Slack is showing on your screen.
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    console.log(`Checking: ${targetUrl}...\n`);
    const page = await browser.newPage();

    // Mask the window dimension characteristics
    await page.setViewport({ width: 1366, height: 768 });

    // Navigate to the Slack invite link
    const response = await page.goto(targetUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });

    if (!response) {
      return { active: false, reason: "No response received from the page." };
    }

    // Capture explicit Cloudflare or block code issues
    if (response.status() === 403) {
      return { active: false, reason: "403 Forbidden. Slack/Cloudflare still flagged the automation signature." };
    }
    if (response.status() >= 400) {
      return { active: false, reason: `HTTP Status Error ${response.status()}` };
    }

    // Extract text content from the rendered layout
    const visibleText = await page.evaluate(() => document.body.innerText.toLowerCase());

    // Slack's exact text blocks when an invitation is dead
    const isExpired = 
      visibleText.includes("no longer active") || 
      visibleText.includes("link has expired") ||
      visibleText.includes("expired") ||
      visibleText.includes("check with the person who invited you");

    if (isExpired) {
      return { active: false, reason: "Link is expired or inactive" };
    }

    return { active: true, reason: "Link appears active and valid!" };

  } catch (error) {
    return { active: false, reason: `Automation Exception: ${error.message}` };
  } finally {
    await browser.close();
  }
}

checkSlackInvite(url).then((result) => {
  if (result.active) {
    console.log(`✅ Success: ${result.reason}`);
  } else {
    console.log(`❌ Failed: ${result.reason}`);
  }
});

