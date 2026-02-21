process.env.ANIMEINWEB_URL = 'https://animeinweb.com';
const scraper = require('./api/scraper');

async function testApi() {
    process.env.NODE_ENV = 'development'; // Disable some Vercel checks if any
    console.log('Testing Trending API...');
    try {
        const trending = await scraper.getTrending();
        console.log('Trending Results Count:', trending.length);
        if (trending.length > 0) {
            console.log('First 2 items:', JSON.stringify(trending.slice(0, 2), null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testApi();
