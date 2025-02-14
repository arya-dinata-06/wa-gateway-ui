# Panduan Penggunaan WhatsApp Gateway API

## Daftar Isi
1. [Persiapan Awal](#persiapan-awal)
2. [Penggunaan dengan Postman](#penggunaan-dengan-postman)
3. [Integrasi dengan Aplikasi Lain](#integrasi-dengan-aplikasi-lain)
4. [Troubleshooting](#troubleshooting)

## Persiapan Awal

### Instalasi dan Menjalankan Server
1. Clone repository:
   ```bash
   git clone https://github.com/arya-dinata-06/wa-gateway-ui.git
   cd wa-gateway-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Jalankan server:
   ```bash
   npm start
   ```

4. Scan QR Code yang muncul di terminal menggunakan WhatsApp di smartphone Anda

### Base URL
```
http://localhost:3000
```

## Penggunaan dengan Postman

### 1. Kirim Pesan Teks

#### Request
- Method: POST
- URL: `{{base_url}}/send-message`
- Headers: 
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
  ```json
  {
      "number": "628123456789",
      "message": "Halo Dunia!"
  }
  ```

#### Langkah-langkah di Postman:
1. Buat request baru
2. Pilih method POST
3. Masukkan URL
4. Pilih tab "Body"
5. Pilih "raw" dan "JSON"
6. Paste JSON request di atas
7. Klik "Send"

### 2. Kirim File/Media

#### Request
- Method: POST
- URL: `{{base_url}}/send-file`
- Headers: None (akan diatur otomatis oleh Postman)
- Body (form-data):
  - file: [pilih file]
  - number: 628123456789
  - caption: Pesan caption (opsional)
  - sendAsDocument: false

#### Langkah-langkah di Postman:
1. Buat request baru
2. Pilih method POST
3. Masukkan URL
4. Pilih tab "Body"
5. Pilih "form-data"
6. Tambahkan key-value pairs:
   - Key: file (Type: File) → Value: pilih file
   - Key: number → Value: masukkan nomor
   - Key: caption → Value: masukkan caption
   - Key: sendAsDocument → Value: true/false

### 3. Cek Status

#### Request
- Method: GET
- URL: `{{base_url}}/status`

#### Langkah-langkah di Postman:
1. Buat request baru
2. Pilih method GET
3. Masukkan URL
4. Klik "Send"

### 4. Logout

#### Request
- Method: POST
- URL: `{{base_url}}/logout`

#### Langkah-langkah di Postman:
1. Buat request baru
2. Pilih method POST
3. Masukkan URL
4. Klik "Send"

## Integrasi dengan Aplikasi Lain

### Menggunakan JavaScript/Node.js

#### Kirim Pesan
```javascript
const sendMessage = async (number, message) => {
    try {
        const response = await fetch('http://localhost:3000/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ number, message })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Penggunaan
sendMessage('628123456789', 'Halo Dunia!')
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

#### Kirim File
```javascript
const sendFile = async (number, file, caption = '', sendAsDocument = false) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('number', number);
        formData.append('caption', caption);
        formData.append('sendAsDocument', sendAsDocument);

        const response = await fetch('http://localhost:3000/send-file', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Penggunaan dengan file input
const fileInput = document.querySelector('input[type="file"]');
sendFile('628123456789', fileInput.files[0], 'Check this out!')
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### Menggunakan PHP

#### Kirim Pesan
```php
function sendWhatsAppMessage($number, $message) {
    $url = 'http://localhost:3000/send-message';
    $data = array(
        'number' => $number,
        'message' => $message
    );

    $options = array(
        'http' => array(
            'header'  => "Content-type: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($data)
        )
    );

    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    return json_decode($result, true);
}

// Penggunaan
try {
    $response = sendWhatsAppMessage('628123456789', 'Halo Dunia!');
    print_r($response);
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
```

#### Kirim File
```php
function sendWhatsAppFile($number, $filePath, $caption = '', $sendAsDocument = false) {
    $url = 'http://localhost:3000/send-file';
    
    $postData = array(
        'number' => $number,
        'caption' => $caption,
        'sendAsDocument' => $sendAsDocument ? 'true' : 'false',
        'file' => new CURLFile($filePath)
    );

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}

// Penggunaan
try {
    $response = sendWhatsAppFile('628123456789', '/path/to/file.jpg', 'Check this out!');
    print_r($response);
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
```

### Menggunakan Python

#### Kirim Pesan
```python
import requests
import json

def send_whatsapp_message(number, message):
    url = 'http://localhost:3000/send-message'
    headers = {'Content-Type': 'application/json'}
    data = {
        'number': number,
        'message': message
    }
    
    response = requests.post(url, headers=headers, json=data)
    return response.json()

# Penggunaan
try:
    response = send_whatsapp_message('628123456789', 'Halo Dunia!')
    print(response)
except Exception as e:
    print(f'Error: {str(e)}')
```

#### Kirim File
```python
import requests

def send_whatsapp_file(number, file_path, caption='', send_as_document=False):
    url = 'http://localhost:3000/send-file'
    
    with open(file_path, 'rb') as file:
        files = {'file': file}
        data = {
            'number': number,
            'caption': caption,
            'sendAsDocument': str(send_as_document).lower()
        }
        
        response = requests.post(url, files=files, data=data)
        return response.json()

# Penggunaan
try:
    response = send_whatsapp_file('628123456789', '/path/to/file.jpg', 'Check this out!')
    print(response)
except Exception as e:
    print(f'Error: {str(e)}')
```

## Troubleshooting

### 1. QR Code Tidak Muncul
- Pastikan server berjalan dengan benar
- Cek log di terminal
- Restart server

### 2. Pesan Error "WhatsApp client not ready"
- Pastikan QR code sudah di-scan
- Cek status koneksi dengan endpoint `/status`
- Jika masih error, logout dan scan ulang

### 3. Format Nomor Tidak Valid
- Pastikan format nomor benar (awalan 0 atau 62)
- Contoh valid: '081234567890' atau '6281234567890'

### 4. File Terlalu Besar
- Maksimum ukuran file: 50MB
- Kompres file sebelum mengirim
- Untuk video, gunakan format yang dioptimasi

### 5. Rate Limiting
- Saat ini belum ada pembatasan rate
- Disarankan memberi jeda antar request untuk stabilitas

### Catatan Penting
1. Pastikan WhatsApp di smartphone tetap terkoneksi ke internet
2. Backup chat WhatsApp secara berkala
3. Jangan menggunakan nomor pribadi untuk sistem produksi
4. Pertimbangkan untuk menggunakan WhatsApp Business API untuk penggunaan skala besar

## Dukungan
Jika mengalami masalah atau membutuhkan bantuan:
1. Cek dokumentasi API di `DOKUMENTASI_API.md`
2. Buka issue di GitHub repository
3. Kontak tim pengembang

---
Terakhir diperbarui: [Tanggal]
