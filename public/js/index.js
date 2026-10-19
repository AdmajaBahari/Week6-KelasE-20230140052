/**
 * @file index.js — halaman muka Warta Pasar (katalog).
 * Mengambil data produk dari DummyJSON pakai Fetch API (tanpa library),
 * lalu menampilkannya sebagai panel iklan bergaya katalog lawas lewat manipulasi DOM.
 */

/* ===================== KONSTANTA (semua angka & teks ada di sini) ===================== */

/** Endpoint produk DummyJSON. */
const API_URL = "https://dummyjson.com/products";
/** Jumlah produk: 1 berita utama + 12 panel iklan (6 pasang panel lebar + panel biasa). */
const PRODUCT_LIMIT = 13;
/** Field yang diambil dari API (hemat data). */
const PRODUCT_FIELDS = "id,title,price,category,thumbnail";
/** Batas waktu menunggu API, dalam milidetik. */
const FETCH_TIMEOUT_MS = 8000;
/** Kode katalog: awalan + (offset + id produk), contoh "6 A 8001". */
const CATALOG_PREFIX = "6 A";
const CATALOG_ID_OFFSET = 8000;
/** Pola ukuran & warna panel, berulang sesuai urutan produk. */
const SPAN_CLASSES = ["ad--wide", "ad--normal"];
const TONE_CLASSES = ["ad--light", "ad--light", "ad--dark"];
/** Locale & mata uang untuk format harga (API mengirim harga dalam USD). */
const PRICE_LOCALE = "en-US";
const PRICE_CURRENCY = "USD";
/** Locale & format tanggal di kepala koran. */
const DATE_LOCALE = "id-ID";
const DATE_FORMAT = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
/** Pemisah slug kategori dari API ("home-decoration" → "home decoration"). */
const CATEGORY_SEPARATOR = "-";
const WORD_SEPARATOR = " ";
/** Penanda yang diganti saat menyusun teks iklan. */
const PLACEHOLDER_NAME = "{nama}";
const PLACEHOLDER_CATEGORY = "{kategori}";
/** Nama class CSS yang dipakai script. */
const CLASS_AD = "ad";
const CLASS_LEAD = "ad--lead";
const CLASS_ERROR = "is-error";

/** Teks iklan pelengkap estetika (dirotasi per panel). */
const AD_COPIES = [
  "Salah satu pilihan terbaik di kelas {kategori}. Dipilih langsung oleh pembeli kami dan dijamin memuaskan. Bandingkan harganya dengan toko lain, lalu lihat berapa banyak yang bisa Anda hemat.",
  "Barang {kategori} pilihan, baru tiba dan siap kirim hari ini. Ribuan keluarga di seluruh negeri sudah memesannya. Cobalah sekali; bila tidak puas, uang Anda kami kembalikan.",
  "Mutu yang sama dengan toko mahal, harga jauh lebih bersahabat. {nama} dikemas rapi dan dikirim ke rumah Anda tanpa biaya tersembunyi.",
  "Setiap {nama} kami periksa satu per satu sebelum dikirim, sebab kepuasan Anda adalah kehormatan kami. Pesanan Anda dilayani dengan sepenuh hati.",
];
/** Teks panel berita utama (dua paragraf). */
const LEAD_COPIES = [
  "{nama} adalah salah satu barang {kategori} terbaik yang mungkin Anda temukan. Hanya bahan pilihan yang kami gunakan, sehingga hasilnya kaya, mantap, dan awet. Ribuan ibu rumah tangga di seluruh negeri sudah memesannya dari kami.",
  "Mutu barang ini sama dengan yang dijual di toko besar, tetapi harganya jauh lebih murah. Jadi Anda untung dua kali: barang bagus, kantong tetap tebal. Cobalah sekali; kami jamin Anda puas, atau uang Anda kembali.",
];

/** Pesan untuk pengguna. */
const MESSAGES = {
  loading: "Memuat kabar pasar...",
  empty: "Belum ada barang dagangan hari ini.",
  retry: "Coba Lagi",
  perUnit: "per buah",
  heroFallback: "Hemat",
  timeout: "Server terlalu lama menjawab. Periksa koneksi lalu coba lagi.",
  network: "Data gagal dimuat. Periksa koneksi internet lalu coba lagi.",
  http: (status) => `Server menolak permintaan (kode ${status}).`,
};

/* ===================== ELEMEN DOM ===================== */

const statusEl = document.getElementById("status");
const catalogEl = document.getElementById("catalog");
const dateEl = document.getElementById("editionDate");
const heroPriceEl = document.getElementById("heroPrice");
const priceListSection = document.getElementById("priceListSection");
const priceListEl = document.getElementById("priceList");

/* ===================== FUNGSI BANTU ===================== */

/**
 * @typedef {Object} Product
 * @property {number} id
 * @property {string} title
 * @property {number} price - Harga dalam USD.
 * @property {string} category
 * @property {string} thumbnail
 */

/**
 * Buat elemen dengan class dan teks (textContent, aman dari injeksi HTML).
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
function el(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/**
 * Format angka USD jadi teks harga.
 * @param {number} usd
 * @returns {string} Contoh: `9.5` → `"$9.50"`.
 */
function formatPrice(usd) {
  return new Intl.NumberFormat(PRICE_LOCALE, {
    style: "currency",
    currency: PRICE_CURRENCY,
  }).format(usd);
}

/**
 * @param {Product} product
 * @returns {string} Kategori yang enak dibaca.
 */
function categoryText(product) {
  return product.category.replaceAll(CATEGORY_SEPARATOR, WORD_SEPARATOR);
}

/**
 * Isi penanda {nama} dan {kategori} pada teks iklan.
 * @param {string} template
 * @param {Product} product
 * @returns {string}
 */
function fillCopy(template, product) {
  return template
    .replaceAll(PLACEHOLDER_NAME, product.title)
    .replaceAll(PLACEHOLDER_CATEGORY, categoryText(product));
}

/**
 * Baris harga bertitik ala katalog: "kode — label ........ $harga".
 * @param {Product} product
 * @param {string} tag - "p" untuk panel, "li" untuk daftar harga.
 * @param {string} label - Teks setelah kode.
 * @returns {HTMLElement}
 */
function createPriceLine(product, tag, label) {
  const line = el(tag, "price-line");
  const code = `${CATALOG_PREFIX} ${CATALOG_ID_OFFSET + product.id}`;
  line.append(
    el("span", "", `${code} — ${label}`),
    el("span", "leader"),
    el("b", "", formatPrice(product.price))
  );
  return line;
}

/* ===================== FETCH ===================== */

/**
 * Ambil daftar produk dari API.
 * @returns {Promise<Product[]>}
 * @throws {Error} Dengan pesan ramah pengguna jika timeout, HTTP error, atau jaringan gagal.
 */
async function fetchProducts() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const url = `${API_URL}?limit=${PRODUCT_LIMIT}&select=${PRODUCT_FIELDS}`;

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(MESSAGES.http(response.status));
    }
    const data = await response.json();
    return data.products;
  } catch (error) {
    if (error.name === "AbortError") throw new Error(MESSAGES.timeout);
    if (error instanceof TypeError) throw new Error(MESSAGES.network);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/* ===================== RENDER ===================== */

/**
 * Buat satu panel iklan.
 * @param {Product} product
 * @param {string[]} classNames - Class tambahan (ukuran & warna panel).
 * @param {string[]} copies - Paragraf teks iklan (masih berisi penanda).
 * @returns {HTMLElement}
 */
function createAd(product, classNames, copies) {
  const ad = el("article", CLASS_AD);
  ad.classList.add(...classNames);

  const price = el("div", "ad-price");
  price.append(el("strong", "", formatPrice(product.price)), el("span", "", MESSAGES.perUnit));
  const head = el("div", "ad-head");
  head.append(el("h3", "ad-title", product.title), price);

  const img = el("img");
  img.src = product.thumbnail;
  img.alt = product.title;
  img.loading = "lazy";
  const photo = el("figure", "ad-photo");
  photo.append(img);

  const text = el("div", "ad-text");
  copies.forEach((copy) => text.append(el("p", "ad-copy", fillCopy(copy, product))));
  text.append(createPriceLine(product, "p", categoryText(product)));

  const body = el("div", "ad-body");
  body.append(photo, text);

  ad.append(head, body);
  return ad;
}

/**
 * Tampilkan semua produk: hero, panel iklan, dan daftar harga.
 * @param {Product[]} products
 */
function renderProducts(products) {
  if (products.length === 0) {
    statusEl.textContent = MESSAGES.empty;
    heroPriceEl.textContent = MESSAGES.heroFallback;
    return;
  }

  const [lead, ...others] = products;
  const ads = [createAd(lead, [CLASS_LEAD], LEAD_COPIES)];
  others.forEach((product, position) => {
    const classNames = [
      SPAN_CLASSES[position % SPAN_CLASSES.length],
      TONE_CLASSES[position % TONE_CLASSES.length],
    ];
    ads.push(createAd(product, classNames, [AD_COPIES[position % AD_COPIES.length]]));
  });
  catalogEl.replaceChildren(...ads);

  priceListEl.replaceChildren(...products.map((p) => createPriceLine(p, "li", p.title)));
  priceListSection.hidden = false;

  heroPriceEl.textContent = formatPrice(Math.min(...products.map((p) => p.price)));
  statusEl.textContent = "";
}

/**
 * Tampilkan pesan error beserta tombol coba lagi.
 * @param {string} message
 */
function showError(message) {
  catalogEl.replaceChildren();
  priceListSection.hidden = true;
  heroPriceEl.textContent = MESSAGES.heroFallback;
  statusEl.className = CLASS_ERROR;
  statusEl.textContent = message;

  const retryButton = el("button", "", MESSAGES.retry);
  retryButton.type = "button";
  retryButton.addEventListener("click", loadProducts);
  statusEl.append(retryButton);
}

/** Alur utama: loading → fetch → tampilkan / error. */
async function loadProducts() {
  statusEl.className = "";
  statusEl.textContent = MESSAGES.loading;
  catalogEl.replaceChildren();

  try {
    renderProducts(await fetchProducts());
  } catch (error) {
    showError(error.message);
  }
}

/* ===================== JALANKAN ===================== */

dateEl.textContent = new Date().toLocaleDateString(DATE_LOCALE, DATE_FORMAT);
loadProducts();
