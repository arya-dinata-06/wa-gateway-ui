# Dokumentasi API WhatsApp Gateway

## URL Dasar
```
http://localhost:3000
```

## Autentikasi
Saat ini, API ini belum menggunakan autentikasi. Pastikan untuk menerapkan autentikasi yang tepat sebelum menggunakan di lingkungan produksi.

## Daftar Endpoint

### 1. Kirim Pesan Teks
Mengirim pesan teks ke nomor WhatsApp.

**Endpoint:** `/send-message`
**Metode:** `POST`
**Content-Type:** `application/json`

**Body Request:**
```json
{
    "number": "628123456789",
    "message": "Halo Dunia!"
}
```

**Parameter:**
| Parameter | Tipe | Wajib | Keterangan |
|-----------|------|-------|------------|
| number | string | Ya | Nomor WhatsApp (bisa diawali 0 atau 62) |
| message | string | Ya | Pesan teks yang akan dikirim |

**Response Sukses:**
```json
{
    "success": true
}
```

**Response Error:**
```json
{
    "error": "Format nomor tidak valid"
}
```

**Contoh Penggunaan dengan cURL:**
```bash
curl -X POST http://localhost:3000/send-message \
-H "Content-Type: application/json" \
-d '{
    "number": "628123456789",
    "message": "Halo Dunia!"
}'
```

### 2. Kirim File/Media
Mengirim file (gambar, video, dokumen) ke nomor WhatsApp.

**Endpoint:** `/send-file`
**Metode:** `POST`
**Content-Type:** `multipart/form-data`

**Parameter Form Data:**
| Parameter | Tipe | Wajib | Keterangan |
|-----------|------|-------|------------|
| file | File | Ya | File yang akan dikirim (maks 50MB) |
| number | string | Ya | Nomor WhatsApp penerima |
| caption | string | Tidak | Keterangan untuk media |
| sendAsDocument | boolean | Tidak | Kirim sebagai dokumen (default: false) |

**Response Sukses:**
```json
{
    "success": true
}
```

**Response Error:**
```json
{
    "error": "Ukuran file terlalu besar"
}
```

**Contoh Penggunaan dengan cURL:**
```bash
curl -X POST http://localhost:3000/send-file \
-F "file=@/path/to/gambar.jpg" \
-F "number=628123456789" \
-F "caption=Cek gambar ini!" \
-F "sendAsDocument=false"
```

### 3. Cek Status
Memeriksa status koneksi WhatsApp dan status QR code.

**Endpoint:** `/status`
**Metode:** `GET`

**Response Sukses:**
```json
{
    "isClientReady": true,
    "qrCodeData": false
}
```

**Keterangan Response:**
| Parameter | Tipe | Keterangan |
|-----------|------|------------|
| isClientReady | boolean | Status koneksi WhatsApp |
| qrCodeData | boolean | Status ketersediaan QR code |

**Contoh Penggunaan dengan cURL:**
```bash
curl http://localhost:3000/status
```

### 4. Logout
Keluar dari sesi WhatsApp Web.

**Endpoint:** `/logout`
**Metode:** `POST`

**Response Sukses:**
```json
{
    "success": true
}
```

**Response Error:**
```json
{
    "error": "Gagal logout"
}
```

**Contoh Penggunaan dengan cURL:**
```bash
curl -X POST http://localhost:3000/logout
```

## Contoh Penggunaan dengan JavaScript

### Kirim Pesan
```javascript
fetch('http://localhost:3000/send-message', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        number: '628123456789',
        message: 'Halo Dunia!'
    })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Kirim File
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('number', '628123456789');
formData.append('caption', 'Cek gambar ini!');
formData.append('sendAsDocument', 'false');

fetch('http://localhost:3000/send-file', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## Catatan Penting

1. **Status Koneksi**
   - Pastikan WhatsApp sudah terhubung (QR code sudah di-scan) sebelum menggunakan API
   - Gunakan endpoint `/status` untuk memeriksa status koneksi

2. **Format Nomor Telepon**
   - Mendukung dua format: diawali '0' atau '62'
   - Contoh: '081234567890' atau '6281234567890'
   - Format yang tidak valid akan mengembalikan error

3. **Upload File**
   - Ukuran maksimum file: 50MB
   - Mendukung file: gambar, video, dokumen
   - File berukuran besar mungkin membutuhkan waktu lebih lama

4. **Penanganan Error**
   - Semua endpoint mengembalikan response JSON
   - Response sukses berisi `{ success: true }`
   - Response error berisi `{ error: "pesan error" }`

5. **Batasan Rate**
   - Saat ini belum ada pembatasan rate
   - Disarankan menerapkan pembatasan rate untuk penggunaan produksi

## Kode Status

| Kode Status | Keterangan |
|-------------|------------|
| 200 | Sukses |
| 400 | Bad Request - Parameter tidak valid |
| 404 | Not Found - Endpoint tidak ditemukan |
| 500 | Server Error - Terjadi kesalahan di server |

## Rencana Pengembangan

1. Sistem autentikasi
2. Pembatasan rate penggunaan API
3. Dukungan webhook untuk status pesan
4. Pengiriman pesan massal
5. Penjadwalan pesan