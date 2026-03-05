import { chromium } from 'playwright';
import { startServer } from './server';

async function launch() {
    console.log('🔧 Starting Jira AI Test Case Generator...\n');

    // Start the Express server
    await startServer();

    // Launch Chromium browser
    console.log('🌐 Launching Chrome browser...\n');
    const browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized'],
    });

    const context = await browser.newContext({
        viewport: null, // Use full window size
    });

    const page = await context.newPage();
    await page.goto('http://localhost:4200');

    console.log('✅ Browser is open at http://localhost:4200');
    console.log('📋 You can now use the Jira AI Test Case Generator!');
    console.log('\nClose the browser window or press Ctrl+C to exit.\n');

    // Wait for the browser to be closed by the user
    page.on('close', async () => {
        console.log('\n👋 Browser closed. Shutting down...');
        await browser.close();
        process.exit(0);
    });

    // Handle process termination
    process.on('SIGINT', async () => {
        console.log('\n👋 Shutting down...');
        await browser.close();
        process.exit(0);
    });
}

launch().catch((err) => {
    console.error('❌ Launch failed:', err.message);
    process.exit(1);
});
