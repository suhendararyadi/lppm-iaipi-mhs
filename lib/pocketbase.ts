import PocketBase from 'pocketbase';

// Mengambil URL dari environment variable.
// Memberikan fallback untuk memastikan aplikasi tidak crash jika variabel tidak ditemukan.
const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';

/**
 * Inisialisasi instance PocketBase menggunakan URL dari environment variables.
 */
export const pb = new PocketBase(pocketbaseUrl);

// Anda dapat menambahkan logika tambahan di sini, misalnya,
// untuk memeriksa status koneksi atau menangani refresh token.
