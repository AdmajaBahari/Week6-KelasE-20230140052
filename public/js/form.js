/**
 * @file form.js — halaman Surat Pembaca.
 * Form interaktif dengan DOM & Event Handling: validasi saat mengetik (input),
 * saat kirim (submit), dan tombol kosongkan (click). Surat yang valid langsung
 * dicetak ke kolom "Surat Terbit".
 */

/* ===================== KONSTANTA (semua angka & teks ada di sini) ===================== */

/** Aturan panjang input. */
const RULES = {
  name: { min: 3, max: 40 },
  message: { min: 10, max: 200 },
};
/** Pola email sederhana: teks@teks.teks tanpa spasi. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Jumlah surat maksimal yang tampil di kolom Surat Terbit. */
const MAX_LETTERS_SHOWN = 5;
/** Penanda "tidak ada error". */
const NO_ERROR = "";
/** Locale & format waktu terbit. */
const DATE_LOCALE = "id-ID";
const DATE_FORMAT = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
const TIME_FORMAT = { hour: "2-digit", minute: "2-digit" };
/** Nama class CSS yang dipakai script. */
const CLASS_ERROR = "is-error";
/** Pesan untuk pengguna. */
const MESSAGES = {
  nameRequired: "Nama wajib diisi.",
  nameLength: `Nama harus ${RULES.name.min}–${RULES.name.max} karakter.`,
  emailRequired: "Email wajib diisi.",
  emailInvalid: "Format email belum benar. Contoh: nama@contoh.com",
  topicRequired: "Pilih jenis surat terlebih dahulu.",
  messageRequired: "Isi surat wajib diisi.",
  messageTooShort: `Isi surat minimal ${RULES.message.min} karakter.`,
  formInvalid: "Surat belum bisa dikirim. Periksa kolom yang bertanda merah.",
  sent: (name) => `Terima kasih, ${name}. Suratmu sudah terbit.`,
};

/* ===================== ELEMEN DOM ===================== */

const form = document.getElementById("letterForm");
const fields = {
  name: document.getElementById("name"),
  email: document.getElementById("email"),
  topic: document.getElementById("topic"),
  message: document.getElementById("message"),
};
const counterEl = document.getElementById("message-counter");
const feedbackEl = document.getElementById("formFeedback");
const letterList = document.getElementById("letterList");
const letterEmpty = document.getElementById("letterEmpty");
const clearButton = document.getElementById("clearLetters");
const dateEl = document.getElementById("editionDate");

/* ===================== VALIDASI ===================== */

/**
 * Validator per field. Tiap fungsi menerima nilai (sudah di-trim)
 * dan mengembalikan pesan error, atau NO_ERROR jika valid.
 * @type {Object<string, function(string): string>}
 */
const VALIDATORS = {
  name(value) {
    if (!value) return MESSAGES.nameRequired;
    if (value.length < RULES.name.min || value.length > RULES.name.max) return MESSAGES.nameLength;
    return NO_ERROR;
  },
  email(value) {
    if (!value) return MESSAGES.emailRequired;
    return EMAIL_PATTERN.test(value) ? NO_ERROR : MESSAGES.emailInvalid;
  },
  topic(value) {
    return value ? NO_ERROR : MESSAGES.topicRequired;
  },
  message(value) {
    if (!value) return MESSAGES.messageRequired;
    return value.length < RULES.message.min ? MESSAGES.messageTooShort : NO_ERROR;
  },
};

/**
 * Validasi satu field, lalu tampilkan / hapus pesan error di bawahnya.
 * @param {string} fieldName - Kunci di objek `fields`.
 * @returns {boolean} `true` jika valid.
 */
function validateField(fieldName) {
  const input = fields[fieldName];
  const error = VALIDATORS[fieldName](input.value.trim());
  document.getElementById(`${fieldName}-error`).textContent = error;
  input.setAttribute("aria-invalid", String(error !== NO_ERROR));
  return error === NO_ERROR;
}

/** Perbarui penghitung karakter isi surat. */
function updateCounter() {
  counterEl.textContent = `${fields.message.value.length}/${RULES.message.max}`;
}

/**
 * Tampilkan pesan umpan balik di bawah tombol kirim.
 * @param {string} text
 * @param {boolean} isError
 */
function showFeedback(text, isError) {
  feedbackEl.textContent = text;
  feedbackEl.classList.toggle(CLASS_ERROR, isError);
}

/* ===================== SURAT TERBIT ===================== */

/** Tampilkan teks "belum ada surat" hanya saat kolom kosong. */
function syncEmptyState() {
  letterEmpty.hidden = letterList.children.length > 0;
}

/**
 * Cetak satu surat ke kolom Surat Terbit (surat terbaru di atas).
 * @param {{name: string, topic: string, message: string}} letter
 */
function publishLetter({ name, topic, message }) {
  const now = new Date();
  const item = document.createElement("article");
  item.className = "letter";

  const title = document.createElement("h4");
  title.textContent = topic;

  const meta = document.createElement("p");
  meta.className = "meta";
  meta.textContent =
    `Dari ${name} · ${now.toLocaleDateString(DATE_LOCALE, DATE_FORMAT)}, ` +
    `${now.toLocaleTimeString(DATE_LOCALE, TIME_FORMAT)}`;

  const body = document.createElement("p");
  body.textContent = message;

  item.append(title, meta, body);
  letterList.prepend(item);

  while (letterList.children.length > MAX_LETTERS_SHOWN) {
    letterList.lastElementChild.remove();
  }
  syncEmptyState();
}

/* ===================== EVENT LISTENER ===================== */

// Validasi langsung saat mengetik / memilih.
Object.keys(fields).forEach((fieldName) => {
  fields[fieldName].addEventListener("input", () => {
    validateField(fieldName);
    if (fieldName === "message") updateCounter();
  });
});

// Kirim form.
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const invalidNames = Object.keys(fields).filter((fieldName) => !validateField(fieldName));
  if (invalidNames.length > 0) {
    showFeedback(MESSAGES.formInvalid, true);
    fields[invalidNames[0]].focus();
    return;
  }

  const letter = {
    name: fields.name.value.trim(),
    topic: fields.topic.value,
    message: fields.message.value.trim(),
  };
  publishLetter(letter);
  form.reset();
  updateCounter();
  showFeedback(MESSAGES.sent(letter.name), false);
});

// Kosongkan kolom Surat Terbit.
clearButton.addEventListener("click", () => {
  letterList.replaceChildren();
  syncEmptyState();
});

/* ===================== JALANKAN ===================== */

fields.message.maxLength = RULES.message.max;
dateEl.textContent = new Date().toLocaleDateString(DATE_LOCALE, DATE_FORMAT);
updateCounter();
syncEmptyState();
