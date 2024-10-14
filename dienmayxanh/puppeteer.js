const puppeteer = require('puppeteer');
// LƯU Ý : Lấy được link xong có thể dùng Crawler hoặc cheerio để lấy detail chứ không nên dùng puppeteer để mở hết các page và lấy details
(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    console.log('Navigating to the page...');
    await page.goto('https://www.dienmayxanh.com/dtdd', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('Page loaded.');

    // Click on the "View More" button until it no longer appears
    while (true) {
        try {
            await page.waitForSelector('.view-more > a', { visible: true, timeout: 5000 });
            const loadMoreButton = await page.$('.view-more > a');
            // Scroll into view before clicking
            await loadMoreButton.evaluate(button => button.scrollIntoView());
            await loadMoreButton.click();
            console.log('Clicked "View More" button.');
            await new Promise(resolve => setTimeout(resolve, 8000)); // wait for new products to load
        } catch (error) {
            console.log('No more "View More" button to click or it is not clickable.');
            break; // Exit the loop if the button is not found or clickable
        }
    }

    // Get all product links from the page
    const productLinks = await page.$$eval('.listproduct .item > a', anchors =>
        anchors.map(anchor => anchor.href)
    );

    console.log(`Found ${productLinks.length} product links.`);

    // Function to get product details from a given product link
    const getProductDetails = async (productUrl) => {
        const productPage = await browser.newPage();
        await productPage.goto(productUrl, { waitUntil: 'networkidle0', timeout: 30000 });

        const details = await productPage.evaluate(() => {
            const details = [];
            document.querySelectorAll('.text-specifi.active li').forEach(element => {
                const name = element.querySelector('aside:first-child').innerText.trim();
                const value = element.querySelector('aside:last-child').innerText.trim();
                details.push({ name, value });
            });
            return details;
        });

        await productPage.close();
        return { url: productUrl, details };
    };

    // Create an array of promises to get details for all products
    const productDetailsPromises = productLinks.map(link => getProductDetails(link));
    const products = await Promise.all(productDetailsPromises);

    console.log('All product details:');
    console.log(products);

    await browser.close();
})();
