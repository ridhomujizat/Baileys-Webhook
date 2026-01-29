# Baileys HTTP Wrapper

HTTP wrapper untuk Baileys WhatsApp library dengan dukungan lengkap untuk mengirim dan menerima semua jenis pesan WhatsApp.

## Features

✅ **Session Management**
- Start/stop WhatsApp sessions
- QR code generation untuk pairing
- Multi-session support
- Session persistence

✅ **Message Types Support**
- Text messages
- Image messages (dengan caption)
- Video messages (dengan caption)
- Audio messages / Voice notes
- Document messages
- Location messages
- Contact messages

✅ **Incoming Messages**
- Webhook integration untuk semua incoming messages
- Real-time message notifications

## Installation

```bash
# Clone repository
git clone <repository-url>
cd Baileys-Webhook

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env sesuai kebutuhan
nano .env
```

## Configuration

Edit file `.env`:

```env
PORT=3000
SESSION_PATH=./sessions
TOKEN=your-secret-token
```

- `PORT`: Port untuk HTTP server
- `SESSION_PATH`: Path untuk menyimpan session data
- `TOKEN`: API authentication token

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Docker Mode

**Using Docker Compose (Recommended):**

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

**Using Docker directly:**

```bash
# Build image
docker build -t baileys-webhook .

# Run container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/sessions:/app/sessions \
  --env-file .env \
  --name baileys-webhook \
  baileys-webhook
```

## API Documentation

**Authentication Required:**
Add `Authorization` header with your token (from `.env`):
`Authorization: Bearer <YOUR_TOKEN>`

Base URL: `http://localhost:3000/api`

### Session Management

#### 1. Start Session

Start WhatsApp session baru.

**Endpoint:** `POST /session/start`

**Request Body:**
```json
{
  "sessionId": "my-session-1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session started successfully",
  "data": {
    "sessionId": "my-session-1",
    "status": "connecting"
  }
}
```

---

#### 2. Get QR Code

Dapatkan QR code untuk pairing WhatsApp.

**Endpoint:** `GET /session/qr/:sessionId`

**Response:**
```json
{
  "success": true,
  "data": {
    "qr": "data:image/png;base64,iVBORw0KGgoAAAANS..."
  }
}
```

QR code dalam format base64 data URL, bisa langsung ditampilkan di `<img>` tag.

---

#### 3. Get Session Status

Cek status koneksi session.

**Endpoint:** `GET /session/status/:sessionId`

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "my-session-1",
    "status": "connected",
    "phone": "628123456789"
  }
}
```

Status: `connecting`, `connected`, atau `disconnected`

---

#### 4. Logout Session

Logout dan hapus session.

**Endpoint:** `POST /session/logout/:sessionId`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### 5. Get All Sessions

List semua active sessions.

**Endpoint:** `GET /session/all`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "my-session-1",
      "status": "connected",
      "phone": "628123456789"
    }
  ]
}
```

---

### Send Messages

#### Send Message (All Types)

Endpoint universal untuk mengirim semua jenis pesan.

**Endpoint:** `POST /message/send`

#### 1. Text Message

```json
{
  "sessionId": "my-session-1",
  "type": "text",
  "to": "628123456789",
  "text": "Hello from Baileys!"
}
```

#### 2. Image Message

```json
{
  "sessionId": "my-session-1",
  "type": "image",
  "to": "628123456789",
  "image": "https://example.com/image.jpg",
  "caption": "Check this image!"
}
```

`image` bisa berupa:
- URL: `https://example.com/image.jpg`
- Base64 dengan prefix: `data:image/jpeg;base64,/9j/4AAQ...`
- Base64 tanpa prefix: `/9j/4AAQ...`

#### 3. Video Message

```json
{
  "sessionId": "my-session-1",
  "type": "video",
  "to": "628123456789",
  "video": "https://example.com/video.mp4",
  "caption": "Watch this video!"
}
```

#### 4. Audio Message

```json
{
  "sessionId": "my-session-1",
  "type": "audio",
  "to": "628123456789",
  "audio": "https://example.com/audio.mp3",
  "ptt": true
}
```

`ptt`: `true` untuk voice note, `false` untuk audio file biasa

#### 5. Document Message

```json
{
  "sessionId": "my-session-1",
  "type": "document",
  "to": "628123456789",
  "document": "https://example.com/document.pdf",
  "fileName": "document.pdf",
  "mimetype": "application/pdf"
}
```

#### 6. Location Message

```json
{
  "sessionId": "my-session-1",
  "type": "location",
  "to": "628123456789",
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

#### 7. Contact Message

```json
{
  "sessionId": "my-session-1",
  "type": "contact",
  "to": "628123456789",
  "contact": {
    "displayName": "John Doe",
    "vcard": "BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL;type=CELL;type=VOICE;waid=628123456789:+62 812-3456-789\nEND:VCARD"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "key": {
      "remoteJid": "628123456789@s.whatsapp.net",
      "id": "3EB0..."
    }
  }
}
```

---

### Webhook (Incoming Messages)

Setiap session dapat dikonfigurasi dengan webhook URL sendiri melalui Dashboard atau API.

**Set Webhook URL via API:**

```bash
curl -X PATCH http://localhost:3000/api/session/my-session/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"webhookUrl": "https://your-server.com/webhook"}'
```

**Webhook Payload:**

```json
{
  "sessionId": "my-session-1",
  "from": "628987654321@s.whatsapp.net",
  "messageType": "conversation",
  "message": {
    "conversation": "Hello!"
  },
  "timestamp": 1234567890
}
```

Message types yang didukung:
- `conversation` - Text message
- `imageMessage` - Image
- `videoMessage` - Video
- `audioMessage` - Audio
- `documentMessage` - Document
- `locationMessage` - Location
- `contactMessage` - Contact
- Dan lain-lain

---

## Example Usage

### Using cURL

#### 1. Start Session
```bash
curl -X POST http://localhost:3000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "my-session"}'
```

#### 2. Get QR Code
```bash
curl http://localhost:3000/api/session/qr/my-session
```

#### 3. Send Text Message
```bash
curl -X POST http://localhost:3000/api/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-session",
    "type": "text",
    "to": "628123456789",
    "text": "Hello from Baileys!"
  }'
```

#### 4. Send Image
```bash
curl -X POST http://localhost:3000/api/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-session",
    "type": "image",
    "to": "628123456789",
    "image": "https://picsum.photos/200",
    "caption": "Random image"
  }'
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Start session
await axios.post(`${API_URL}/session/start`, {
  sessionId: 'my-session'
});

// Get QR code
const qrResponse = await axios.get(`${API_URL}/session/qr/my-session`);
console.log('QR Code:', qrResponse.data.data.qr);

// Send text message
await axios.post(`${API_URL}/message/send`, {
  sessionId: 'my-session',
  type: 'text',
  to: '628123456789',
  text: 'Hello!'
});
```

---

## Project Structure

```
Baileys-Webhook/
├── src/
│   ├── config/
│   │   └── config.ts          # Configuration
│   ├── services/
│   │   ├── whatsapp.service.ts # Baileys integration
│   │   └── session.service.ts  # Session management
│   ├── controllers/
│   │   ├── session.controller.ts
│   │   └── message.controller.ts
│   ├── routes/
│   │   ├── session.routes.ts
│   │   └── message.routes.ts
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── utils/
│   │   └── logger.ts          # Logger
│   └── app.ts                 # Express app
├── sessions/                   # Session data (auto-created)
├── .env                        # Environment variables
├── package.json
└── tsconfig.json
```

---

## Notes

- Nomor telepon harus dalam format internasional tanpa `+` (contoh: `628123456789`)
- Session data disimpan di folder `sessions/` untuk persistence
- QR code hanya tersedia saat status `connecting`, setelah connected QR akan hilang
- Webhook URL harus accessible dari server
- Support multi-device WhatsApp
- Media (image, video, audio, document) bisa berupa URL atau base64

---

## Troubleshooting

### Session tidak connect
- Pastikan scan QR code dengan cepat
- Cek koneksi internet
- Pastikan WhatsApp di HP sudah multi-device

### Webhook tidak menerima messages
- Pastikan webhook URL sudah diset per-session (via Dashboard atau API)
- Pastikan webhook endpoint bisa diakses dari server
- Cek logs untuk error

### Error saat kirim media
- Pastikan URL media bisa diakses
- Untuk base64, pastikan format sudah benar
- Cek ukuran file tidak terlalu besar

---

## License

ISC
