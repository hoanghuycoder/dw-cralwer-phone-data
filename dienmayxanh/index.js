const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
async function getProductDetails(link) {
    const { data } = await axios.get(link);
    const $ = cheerio.load(data);
    const details = [];

    // Lấy tên sản phẩm từ thẻ h1
    const productName = $('h1').text().trim();
    details.push({ name: "Tên sản phẩm", value: productName });

    // Lấy giá từ thẻ .box-price-present
    const productPrice = $('.box-price-present').text().trim();
    details.push({ name: "Giá", value: productPrice });

    // Duyệt qua từng phần tử <li> để lấy tên và giá trị
    $('.text-specifi li').each((index, element) => {
        const name = $(element).find('aside:first-child').text().trim();
        const value = $(element).find('aside:last-child').text().trim();
        details.push({ name, value });
    });

    return details;
}

async function fetchProductLink() {
    const url = "https://www.dienmayxanh.com/Category/FilterProductBox?c=42&o=13&pi=";
    const headers = {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-ch-ua": "\"Microsoft Edge\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": "\"Android\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "Referer": "https://www.dienmayxanh.com/dien-thoai",
        "Referrer-Policy": "no-referrer-when-downgrade"
    };
    const body = "IsParentCate=False&IsShowCompare=True&prevent=true";
    let pageIndex = 0;
    let links = [];
    
    while (true) {
        try {
            console.log('Getting page index', pageIndex);
            // Fetch data list product từ web
            const response = await axios.post(url + pageIndex, body, { headers: headers });
            const html = response.data.listproducts;
            if (!html || html.trim() === "") {
                console.log("No more products to fetch.");
                break;
            }
            const $ = cheerio.load(html); // nạp html
            $('.item > a').each((index, element) => {
                const href = $(element).attr('href');
                if (href) {
                    links.push(`https://www.dienmayxanh.com${href}`);
                }
            });
            pageIndex++;
        } catch (error) {
            console.error('Error fetching data:', error);
            break;
        }
    }
    
    console.log("Total products fetched:", links.length);
    return links;
}

async function main() {
    const allProductLinks = await fetchProductLink();
    const chunkSize = 30; // Kích thước mỗi nhóm
    const allProductsDetails = [];

    // Chia mảng thành các nhóm và xử lý từng nhóm
    for (let i = 0; i < allProductLinks.length; i += chunkSize) {
        const chunk = allProductLinks.slice(i, i + chunkSize); // Lấy một nhóm "chunkSize" sản phẩm, lấy nhiều quá bị lỗi 429
        console.log(`Fetching details for products ${i + 1} to ${Math.min(i + chunkSize, allProductLinks.length)}`);
        
        const productsDetails = await Promise.all(chunk.map(link => getProductDetails(link)));
        allProductsDetails.push(...productsDetails); // Thêm chi tiết sản phẩm vào danh sách tổng
    }
    fs.writeFileSync('product_details.json', JSON.stringify(allProductsDetails, null, 2), 'utf-8');
    console.log('Product details saved to product_details.json');
    // Hiển thị thông tin sản phẩm
    // allProductsDetails.forEach((details, index) => {
    //     console.log(`Details for product ${index + 1}:`, details);
    // });
}

main();
