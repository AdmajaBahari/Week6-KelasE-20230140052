# Week 6 — Warta Pasar

Tugas PPAW Week 6: **JavaScript DOM, Event Handling, dan Fetch API**.
Dua halaman web statis (HTML + CSS + JavaScript native, tanpa library) bergaya koran vintage 90-an.

- **Repository:** https://github.com/AdmajaBahari/Week6-KelasE-20230140052
- **Live demo (GitHub Pages):** https://admajabahari.github.io/Week6-KelasE-20230140052/

## Halaman

### Halaman Muka (`public/index.html`) — Fetch API
Menarik 13 produk dari [dummyjson.com/products](https://dummyjson.com/products) dan menampilkan **nama** dan **harga** lewat DOM, dalam gaya halaman iklan katalog lawas: hero harga termurah, panel iklan berbagai ukuran, baris harga bertitik, dan daftar harga lengkap.
- Ada status *loading* saat data diambil
- Ada penanganan error (timeout, HTTP error, jaringan) lengkap dengan tombol **Coba Lagi**

### Surat Pembaca (`public/form.html`) — DOM & Event Handling
Form surat pembaca: nama, email, jenis surat, isi surat.
- Event `input`: validasi langsung + penghitung karakter
- Event `submit`: validasi semua field, lalu surat tercetak di kolom **Surat Terbit**
- Event `click`: tombol **Kosongkan Kolom**

| Field | Aturan |
|---|---|
| Nama | wajib, 3–40 karakter |
| Email | wajib, format email valid |
| Jenis surat | wajib dipilih |
| Isi surat | wajib, 10–200 karakter |

## Tanpa magic number
Semua angka, URL, pola, dan teks pesan dideklarasikan sebagai konstanta di **bagian atas** `public/js/index.js` dan `public/js/form.js`.

## Struktur Folder

```
Week6-KelasE-20230140052/
├── .github/workflows/
│   └── pages.yml       # deploy folder public/ ke GitHub Pages
├── public/
│   ├── index.html      # Halaman Muka (Fetch API)
│   ├── form.html       # Surat Pembaca (DOM & Event)
│   ├── css/
│   │   ├── index.css   # gaya dasar koran vintage (dipakai kedua halaman)
│   │   ├── katalog.css # gaya katalog iklan halaman muka
│   │   └── form.css    # gaya khusus form
│   └── js/
│       ├── index.js    # fetch, loading, error, render produk
│       └── form.js     # validasi, event listener, cetak surat
├── latihan/
│   └── fetch.js        # uji coba fetch di Node
└── README.md
```

## Cara Menjalankan Lokal

```bash
git clone https://github.com/AdmajaBahari/Week6-KelasE-20230140052.git
cd Week6-KelasE-20230140052
```

Lalu buka `public/index.html` di browser (perlu internet untuk Fetch API dan font).

## Deploy ke GitHub Pages

`index.html` berada di folder `public/`, sedangkan Pages bawaan hanya bisa memilih `/` atau `/docs`. Karena itu repo ini memakai **GitHub Actions** (`.github/workflows/pages.yml`) untuk menerbitkan folder `public/`.

Pengaturan yang dipakai:
1. **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Setiap push ke branch `main` menjalankan workflow *Deploy ke GitHub Pages* secara otomatis (cek di tab **Actions**).
3. Situs aktif di https://admajabahari.github.io/Week6-KelasE-20230140052/

Jalur file di HTML memakai jalur relatif (`css/index.css`, bukan `/css/index.css`) supaya tetap jalan di subpath `/Week6-KelasE-20230140052/`.