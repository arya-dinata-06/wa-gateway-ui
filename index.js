const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const multer = require('multer');
const CustomWebCache = require('./custom-web-cache');

// Inisialisasi Express
const app = express();
const port = process.env.PORT || 3000;

// Konfigurasi Multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Variabel global
let qrCodeData = null;
let isClientReady = false;
let client = null;

// Konfigurasi puppeteer
const puppeteerOptions = {
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ]
    }
};

// Fungsi inisialisasi client
async function initializeClient() {
    try {
        client = new Client({
            authStrategy: new LocalAuth(),
            ...puppeteerOptions
        });

        client.on('qr', (qr) => {
            console.log('QR Code received');
            qrCodeData = qr; // Simpan string QR code mentah
        });

        client.on('ready', () => {
            console.log('Client is ready!');
            isClientReady = true;
            qrCodeData = null;
        });

        client.on('disconnected', () => {
            console.log('Client disconnected');
            isClientReady = false;
            qrCodeData = null;
        });

        await client.initialize();
    } catch (err) {
        console.error('Failed to initialize client:', err);
        throw err;
    }
}

// Routes
app.get('/', (req, res) => {
    if (isClientReady) {
        res.redirect('/send-message');
    } else if (qrCodeData) {
        // Generate QR code dan tampilkan sebagai gambar
        qrcode.toDataURL(qrCodeData, (err, url) => {
            if (err) {
                res.send('Error generating QR code');
                return;
            }
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>WhatsApp QR Code</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background-color: #f0f2f5;
                        }
                        .container {
                            text-align: center;
                            background: white;
                            padding: 20px;
                            border-radius: 10px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        }
                        h1 { color: #128C7E; }
                        .status {
                            margin: 10px 0;
                            color: #666;
                        }
                        img {
                            max-width: 300px;
                            height: auto;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Scan QR Code</h1>
                        <p class="status">Waiting for scan...</p>
                        <img src="${url}" alt="QR Code">
                    </div>
                    <script>
                        // Fungsi untuk memeriksa status QR dan client
                        async function checkStatus() {
                            try {
                                const response = await fetch('/status');
                                const data = await response.json();
                                
                                if (data.isClientReady) {
                                    window.location.href = '/send-message';
                                } else if (!data.qrCodeData) {
                                    // Jika tidak ada QR code dan client tidak ready, reload halaman
                                    window.location.reload();
                                }
                            } catch (error) {
                                console.error('Error checking status:', error);
                            }
                        }

                        // Periksa status setiap 3 detik
                        setInterval(checkStatus, 3000);
                    </script>
                </body>
                </html>
            `);
        });
    } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Initializing WhatsApp</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        background-color: #f0f2f5;
                    }
                    .container {
                        text-align: center;
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }
                    h1 { color: #128C7E; }
                    .status {
                        margin: 10px 0;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Initializing...</h1>
                    <p class="status">Please wait while we initialize WhatsApp...</p>
                </div>
                <script>
                    // Fungsi untuk memeriksa status
                    async function checkStatus() {
                        try {
                            const response = await fetch('/status');
                            const data = await response.json();
                            
                            if (data.isClientReady) {
                                window.location.href = '/send-message';
                            } else if (data.qrCodeData) {
                                window.location.reload();
                            }
                        } catch (error) {
                            console.error('Error checking status:', error);
                        }
                    }

                    // Periksa status setiap 2 detik
                    setInterval(checkStatus, 2000);
                </script>
            </body>
            </html>
        `);
    }
});

app.get('/qr', (req, res) => {
    if (qrCodeData) {
        qrcode.toDataURL(qrCodeData, (err, url) => {
            if (err) {
                res.status(500).send('Error generating QR code');
                return;
            }
            res.send(`<img src="${url}" alt="QR Code">`);
        });
    } else {
        res.send('No QR code available');
    }
});

app.get('/send-message', (req, res) => {
    if (!isClientReady) {
        return res.redirect('/');
    }
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>WhatsApp Message Sender</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; }
                input[type="text"], textarea { width: 100%; padding: 8px; }
                button { padding: 10px 15px; background: #25D366; color: white; border: none; cursor: pointer; }
                .nav-buttons { margin-bottom: 20px; display: flex; justify-content: space-between; }
                .nav-buttons .menu-buttons { display: flex; gap: 10px; }
                .nav-buttons a, .nav-buttons button { 
                    padding: 10px 15px; 
                    background: #25D366; 
                    color: white; 
                    text-decoration: none;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                }
                .nav-buttons .logout-btn {
                    background: #dc3545;
                }
                .success-message {
                    color: #25D366;
                    padding: 10px;
                    margin-top: 10px;
                    display: none;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <h1>WhatsApp Sender</h1>
            <div class="nav-buttons">
                <div class="menu-buttons">
                    <a href="/send-message">Send Message</a>
                    <a href="/send-file">Send File</a>
                </div>
                <button onclick="logout()" class="logout-btn">Logout</button>
            </div>
            
            <form id="messageForm" onsubmit="sendMessage(event)">
                <div class="form-group">
                    <label for="number">Phone Number (e.g., 081234567890):</label>
                    <input type="text" id="number" name="number" required>
                </div>
                <div class="form-group">
                    <label for="message">Message:</label>
                    <textarea id="message" name="message" rows="4" required></textarea>
                </div>
                <button type="submit">Send Message</button>
                <div id="messageSuccess" class="success-message">Message sent successfully!</div>
            </form>

            <script>
                async function sendMessage(e) {
                    e.preventDefault();
                    const number = document.getElementById('number').value;
                    const message = document.getElementById('message').value;
                    
                    try {
                        const response = await fetch('/send-message', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ number, message })
                        });
                        
                        const result = await response.json();
                        if (result.success) {
                            e.target.reset();
                            showSuccess('messageSuccess');
                        } else {
                            alert('Failed to send message: ' + result.error);
                        }
                    } catch (error) {
                        alert('Error sending message: ' + error);
                    }
                }

                async function logout() {
                    try {
                        const response = await fetch('/logout', {
                            method: 'POST'
                        });
                        const result = await response.json();
                        if (result.success) {
                            window.location.href = '/';
                        } else {
                            alert('Failed to logout');
                        }
                    } catch (error) {
                        alert('Error during logout: ' + error);
                    }
                }

                function showSuccess(elementId) {
                    const element = document.getElementById(elementId);
                    element.style.display = 'block';
                    setTimeout(() => {
                        element.style.display = 'none';
                    }, 3000);
                }
            </script>
        </body>
        </html>
    `);
});

// Route baru untuk halaman send file
app.get('/send-file', (req, res) => {
    if (!isClientReady) {
        return res.redirect('/');
    }
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>WhatsApp File Sender</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; }
                input[type="text"], textarea { width: 100%; padding: 8px; }
                button { padding: 10px 15px; background: #25D366; color: white; border: none; cursor: pointer; }
                .nav-buttons { margin-bottom: 20px; display: flex; justify-content: space-between; }
                .nav-buttons .menu-buttons { display: flex; gap: 10px; }
                .nav-buttons a, .nav-buttons button { 
                    padding: 10px 15px; 
                    background: #25D366; 
                    color: white; 
                    text-decoration: none;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                }
                .nav-buttons .logout-btn {
                    background: #dc3545;
                }
                .success-message {
                    color: #25D366;
                    padding: 10px;
                    margin-top: 10px;
                    display: none;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <h1>WhatsApp Sender</h1>
            <div class="nav-buttons">
                <div class="menu-buttons">
                    <a href="/send-message">Send Message</a>
                    <a href="/send-file">Send File</a>
                </div>
                <button onclick="logout()" class="logout-btn">Logout</button>
            </div>

            <form id="fileForm" onsubmit="sendFile(event)">
                <div class="form-group">
                    <label for="fileNumber">Phone Number (e.g., 081234567890):</label>
                    <input type="text" id="fileNumber" name="number" required>
                </div>
                <div class="form-group">
                    <label for="file">File:</label>
                    <input type="file" id="file" name="file" required>
                </div>
                <div class="form-group">
                    <label for="caption">Caption (optional):</label>
                    <textarea id="caption" name="caption" rows="4"></textarea>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="sendAsDocument" id="sendAsDocument">
                        Send as Document
                    </label>
                </div>
                <button type="submit">Send File</button>
                <div id="fileSuccess" class="success-message">File sent successfully!</div>
            </form>

            <script>
                async function sendFile(e) {
                    e.preventDefault();
                    const formData = new FormData();
                    formData.append('number', document.getElementById('fileNumber').value);
                    formData.append('file', document.getElementById('file').files[0]);
                    formData.append('caption', document.getElementById('caption').value);
                    formData.append('sendAsDocument', document.getElementById('sendAsDocument').checked);
                    
                    try {
                        const response = await fetch('/send-file', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const result = await response.json();
                        if (result.success) {
                            e.target.reset();
                            showSuccess('fileSuccess');
                        } else {
                            alert('Failed to send file: ' + result.error);
                        }
                    } catch (error) {
                        alert('Error sending file: ' + error);
                    }
                }

                async function logout() {
                    try {
                        const response = await fetch('/logout', {
                            method: 'POST'
                        });
                        const result = await response.json();
                        if (result.success) {
                            window.location.href = '/';
                        } else {
                            alert('Failed to logout');
                        }
                    } catch (error) {
                        alert('Error during logout: ' + error);
                    }
                }

                function showSuccess(elementId) {
                    const element = document.getElementById(elementId);
                    element.style.display = 'block';
                    setTimeout(() => {
                        element.style.display = 'none';
                    }, 3000);
                }
            </script>
        </body>
        </html>
    `);
});

// File upload endpoint
app.post('/send-file', upload.single('file'), async (req, res) => {
    if (!isClientReady) {
        return res.status(503).json({ error: 'WhatsApp client not ready' });
    }

    try {
        const { number, caption } = req.body;
        if (!number || !req.file) {
            return res.status(400).json({ error: 'Number and file are required' });
        }

        let formattedNumber = number.replace(/\D/g, '');
        if (formattedNumber.startsWith('0')) {
            formattedNumber = '62' + formattedNumber.substring(1);
        }
        formattedNumber = `${formattedNumber}@c.us`;

        const media = new MessageMedia(
            req.file.mimetype,
            req.file.buffer.toString('base64'),
            req.file.originalname
        );

        await client.sendMessage(formattedNumber, media, {
            caption: caption || '',
            sendMediaAsDocument: req.body.sendAsDocument === 'true'
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Send file error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Text message endpoint
app.post('/send-message', async (req, res) => {
    if (!isClientReady) {
        return res.status(503).json({ error: 'WhatsApp client not ready' });
    }

    try {
        const { number, message } = req.body;
        if (!number || !message) {
            return res.status(400).json({ error: 'Number and message are required' });
        }

        let formattedNumber = number.replace(/\D/g, '');
        if (formattedNumber.startsWith('0')) {
            formattedNumber = '62' + formattedNumber.substring(1);
        }
        formattedNumber = `${formattedNumber}@c.us`;

        await client.sendMessage(formattedNumber, message);
        res.json({ success: true });
    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Logout endpoint
app.post('/logout', async (req, res) => {
    try {
        if (client) {
            await client.logout(); // Menggunakan method logout() dari whatsapp-web.js
            await client.destroy();
            isClientReady = false;
            qrCodeData = null;
            
            // Inisialisasi ulang client setelah logout
            setTimeout(() => {
                initializeClient().catch(console.error);
            }, 1000);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
});

// Tambahkan endpoint baru untuk memeriksa status
app.get('/status', (req, res) => {
    res.json({
        isClientReady,
        qrCodeData: !!qrCodeData // Hanya kirim boolean status ketersediaan QR
    });
});

// Start server and initialize WhatsApp client
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    initializeClient().catch(console.error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing server and client...');
    if (client) await client.destroy();
    server.close(() => process.exit(0));
});
