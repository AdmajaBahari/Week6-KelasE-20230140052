/**
 * Uji coba fetch produk dari dummyjson, hasilnya dicetak ke console.
 * Jalankan: node latihan/fetch.js
 */
const TEST_URL = "https://dummyjson.com/products?limit=3&select=title,price";

/**
 * @returns {Promise<void>}
 */
async function testFetchAPI() {
  try {
    const response = await fetch(TEST_URL);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();
    console.log("Test fetch successful:", data.products);
  } catch (error) {
    console.error("Test fetch error:", error);
  }
}

testFetchAPI();
