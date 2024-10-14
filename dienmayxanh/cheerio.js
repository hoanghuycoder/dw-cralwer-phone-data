const axios = require('axios');
const cheerio = require('cheerio');

// URL danh sách sản phẩm
// LƯU Ý : Không crawl được khi chỉnh param query pi trên link

const listUrl = 'https://www.dienmayxanh.com/dtdd#c=42&o=13&pi=2';

// // Hàm lấy tất cả các liên kết sản phẩm từ trang danh sách
async function getProductLinks() {
    const { data } = await axios.get(listUrl);
    const $ = cheerio.load(data);
    const links = [];

    // Chọn tất cả các link sản phẩm và lưu vào mảng links
    $('.listproduct .item > a').each((index, element) => {
        const href = $(element).attr('href');
        if (href) {
            links.push(`https://www.dienmayxanh.com${href}`);
        }
    });

    return links;
}

// Hàm lấy chi tiết sản phẩm từ từng link
async function getProductDetails(link) {
    const { data } = await axios.get(link);
    const $ = cheerio.load(data);
    const details = [];

    // Duyệt qua từng phần tử <li> để lấy tên và giá trị
    $('.text-specifi li').each((index, element) => {
        const name = $(element).find('aside:first-child').text().trim();
        const value = $(element).find('aside:last-child').text().trim();
        details.push({ name, value });
    });

    return details;
}

// Hàm chính để điều khiển luồng công việc
async function main() {
    try {
        // Lấy tất cả các link sản phẩm
        const productLinks = [
            'https://www.dienmayxanh.com/dien-thoai/iphone-16-pro-max-512gb',
            'https://www.dienmayxanh.com/dien-thoai/iphone-16-pro',
            'https://www.dienmayxanh.com/dien-thoai/iphone-16-plus',
            'https://www.dienmayxanh.com/dien-thoai/iphone-16',
            'https://www.dienmayxanh.com/dien-thoai/xiaomi-14t-5g',
        ]
        

        // Sử dụng Promise.all để thu thập chi tiết từng sản phẩm đồng thời
        const allProductsDetails = await Promise.all(productLinks.map(link => getProductDetails(link)));

        // // In ra danh sách chi tiết tất cả các sản phẩm
        console.log(allProductsDetails);
    } catch (error) {
        console.error('Có lỗi xảy ra:', error);
    }
}

main();
