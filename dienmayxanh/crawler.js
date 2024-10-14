(async () => {
    const Crawler = (await import('crawler')).default;
   // LƯU Ý : Không crawl được khi chỉnh param query pi trên link
    const listUrl = 'https://www.dienmayxanh.com/dtdd#c=42&o=13&pi=2';

    const c = new Crawler({
        maxConnections: 10,
    });

    function getProductLinks() {
        return new Promise((resolve, reject) => {
            c.queue({
                uri: listUrl,
                callback: (error, res, done) => {
                    if (error) {
                        reject(error);
                    } else {
                        const $ = res.$;
                        const links = [];

                        $('.listproduct .item > a').each((index, element) => {
                            const href = $(element).attr('href');
                            if (href) {
                                links.push(`https://www.dienmayxanh.com${href}`);
                            }
                        });

                        resolve(links);
                    }
                    done();
                }
            });
        });
    }

    function getProductDetails(link) {
        return new Promise((resolve, reject) => {
            c.queue({
                uri: link,
                callback: (error, res, done) => {
                    if (error) {
                        reject(error);
                    } else {
                        const $ = res.$;
                        const details = [];

                        $('.text-specifi li').each((index, element) => {
                            const name = $(element).find('aside:first-child').text().trim();
                            const value = $(element).find('aside:last-child').text().trim();
                            details.push({ name, value });
                        });

                        resolve(details);
                    }
                    done();
                }
            });
        });
    }

    async function main() {
        try {
            const productLinks = [
                'https://www.dienmayxanh.com/dien-thoai/iphone-16-pro-max-512gb',
                'https://www.dienmayxanh.com/dien-thoai/iphone-16-pro',
            ]
            const allProductsDetails = await Promise.all(productLinks.map(link => getProductDetails(link)));
            console.log(allProductsDetails);
        } catch (error) {
            console.error('Có lỗi xảy ra:', error);
        }
    }

    main();
})();
