const { cfFetchWithRetry } = require('./api/cf-fetch');
const ANIMEINWEB_URL = "https://animeinweb.com";

async function test() {
    console.log("Primer...");
    try {
        await cfFetchWithRetry(`${ANIMEINWEB_URL}/api/proxy/3/2/schedule/data?day=SENIN`, { timeout: 10000 });
        console.log("Prime Success. Fetching detail...");
        
        const data = await cfFetchWithRetry(`${ANIMEINWEB_URL}/api/proxy/3/2/movie/detail/426`, { timeout: 10000 });
        console.log("Detail Success:", data?.data?.movie?.title);
    } catch(e) {
        console.error("Fail:", e.message);
    }
}
test();
