# Outgoing Messages Guide

## Overview

This guide explains how to send WhatsApp messages using the Baileys-Webhook API. You can send various types of messages including text, images, videos, audio, documents, locations, and contacts.

---

## API Endpoint

**POST** `/api/message/send`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN
```

> **Note:** Authentication is required if you set the `TOKEN` environment variable. If no token is configured, the Authorization header is optional.

**Base Request Structure:**
```json
{
  "sessionId": "your-session-id",
  "type": "text|image|video|audio|document|location|contact",
  "to": "phone-number-or-jid",
  ... // type-specific fields
}
```

---

## Message Types

### 1. Text Message

Send a plain text message.

**Request:**
```json
{
  "sessionId": "my-session",
  "type": "text",
  "to": "628123456789",
  "text": "Hello! How are you?"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/message/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "sessionId": "my-session",
    "type": "text",
    "to": "628123456789",
    "text": "Hello! How are you?"
  }'
```

**Without Authentication (if TOKEN not configured):**
```bash
curl -X POST http://localhost:3000/api/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-session",
    "type": "text",
    "to": "628123456789",
    "text": "Hello! How are you?"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "status": 2,
    "timestamp": 1708172400,
    "messageID": "3EB0C6D3F2A4E8B9"
  }
}
```

---

### 2. Image Message

Send an image with an optional caption.

**Request:**
```json
{
  "sessionId": "my-session",
  "type": "image",
  "to": "628123456789",
  "image": "https://example.com/image.jpg",
  "caption": "Check out this image!"
}
```

**Image Source Options:**

1. **URL:**
```json
{
  "image": "https://example.com/image.jpg"
}
```

2. **Base64 with Data URI:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

3. **Base64 without prefix:**
```json
{
  "image": "/9j/4AAQSkZJRg..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-session",
    "type": "image",
    "to": "628123456789",
    "image": "https://picsum.photos/800/600",
    "caption": "Beautiful landscape!"
  }'
```

---

### 3. Video Message

Send a video with an optional caption.

**Request:**
```json
{
  "sessionId": "my-session",
  "type": "video",
  "to": "628123456789",
  "video": "https://example.com/video.mp4",
  "caption": "Watch this cool video!"
}
```

**Video Source Options:**
- URL: `https://example.com/video.mp4`
- Base64 with data URI: `data:video/mp4;base64,...`
- Base64 without prefix

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-session",
    "type": "video",
    "to": "628123456789",
    "video": "https://example.com/sample.mp4",
    "caption": "Tutorial video"
  }'
```

---

### 4. Audio Message

Send audio files or voice notes (PTT - Push To Talk).

**Regular Audio:**
```json
{
  "sessionId": "my-session",
  "type": "audio",
  "to": "628123456789",
  "audio": "https://example.com/audio.mp3",
  "ptt": false
}
```

**Voice Note (PTT):**
```json
{
  "sessionId": "my-session",
  "type": "audio",
  "to": "628123456789",
  "audio": "https://example.com/voice.ogg",
  "ptt": true
}
```

**Audio Source Options:**
- URL: `https://example.com/audio.mp3`
- Base64 with data URI: `data:audio/mpeg;base64,...`
- Base64 without prefix

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-session",
    "type": "audio",
    "to": "628123456789",
    "audio": "https://example.com/song.mp3",
    "ptt": false
  }'
```

---

### 5. Document Message

Send documents (PDF, Word, Excel, etc.) with a filename.

**Request:**
```json
{
  "sessionId": "my-session",
  "type": "document",
  "to": "628123456789",
  "document": "https://example.com/report.pdf",
  "fileName": "Monthly Report.pdf",
  "mimetype": "application/pdf"
}
```

**Fields:**
- `document` (required): URL or base64 encoded file
- `fileName` (required): Display name for the file
- `mimetype` (optional): MIME type (default: `application/octet-stream`)

**Common MIME Types:**
- PDF: `application/pdf`
- Word: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Text: `text/plain`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-session",
    "type": "document",
    "to": "628123456789",
    "document": "https://example.com/invoice.pdf",
    "fileName": "Invoice_2024.pdf",
    "mimetype": "application/pdf"
  }'
```

---

### 6. Location Message

Send a geographic location.

**Request:**
```json
{
  "sessionId": "my-session",
  "type": "location",
  "to": "628123456789",
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

**Fields:**
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-session",
    "type": "location",
    "to": "628123456789",
    "latitude": -6.2088,
    "longitude": 106.8456
  }'
```

---

### 7. Contact Message

Send a contact card (vCard).

**Request:**
```json
{
  "sessionId": "my-session",
  "type": "contact",
  "to": "628123456789",
  "contact": {
    "displayName": "John Doe",
    "vcard": "BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL;type=CELL;type=VOICE;waid=628987654321:+62 898-7654-321\nEND:VCARD"
  }
}
```

**vCard Format:**
```
BEGIN:VCARD
VERSION:3.0
FN:Full Name
TEL;type=CELL;type=VOICE;waid=628987654321:+62 898-7654-321
EMAIL:email@example.com
END:VCARD
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/message/send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-session",
    "type": "contact",
    "to": "628123456789",
    "contact": {
      "displayName": "Jane Smith",
      "vcard": "BEGIN:VCARD\nVERSION:3.0\nFN:Jane Smith\nTEL;type=CELL;type=VOICE;waid=628111222333:+62 811-222-333\nEND:VCARD"
    }
  }'
```

---

## Replying to Messages

You can reply to any message type by adding `replyTo` field with the message ID you want to quote.

### Reply to a Text Message

**Request:**
```json
{
  "sessionId": "my-session",
  "type": "text",
  "to": "628123456789",
  "text": "Yes, I received it!",
  "replyTo": "3EB0C6D3F2A4E8B9"
}
```

### Reply in a Group Chat

When replying in a group to a specific participant's message:

**Request:**
```json
{
  "sessionId": "my-session",
  "type": "text",
  "to": "120363123456789012@g.us",
  "text": "Thanks for sharing!",
  "replyTo": "3EB0C6D3F2A4E8B9",
  "participant": "628123456789@s.whatsapp.net"
}
```

**Fields:**
- `replyTo`: Message ID to quote
- `participant`: JID of the group member who sent the original message (group only)

### Reply with Media

**Request:**
```json
{
  "sessionId": "my-session",
  "type": "image",
  "to": "628123456789",
  "image": "https://example.com/response.jpg",
  "caption": "Here's the answer!",
  "replyTo": "3EB0C6D3F2A4E8B9"
}
```

---

## Phone Number Formats

The API supports multiple phone number formats:

### Individual Chats

**Clean number (recommended):**
```json
{
  "to": "628123456789"
}
```

**Full JID:**
```json
{
  "to": "628123456789@s.whatsapp.net"
}
```

### Group Chats

**Group JID (required format):**
```json
{
  "to": "120363123456789012@g.us"
}
```

> **Note:** The API automatically adds `@s.whatsapp.net` suffix for regular phone numbers.

---

## Error Handling

### Common Errors

**1. Session Not Found**
```json
{
  "success": false,
  "error": "Session not found. Please start a session first."
}
```

**2. Session Not Connected**
```json
{
  "success": false,
  "error": "Session is not connected. Please scan QR code first."
}
```

**3. Invalid Message Type**
```json
{
  "success": false,
  "error": "Invalid message type"
}
```

**4. Missing Required Fields**
```json
{
  "success": false,
  "error": "sessionId is required"
}
```

**5. Media Download Failed**
```json
{
  "success": false,
  "error": "Failed to download media from URL"
}
```

---

## Integration Examples

### Python (requests)

```python
import requests
import base64

class WhatsAppClient:
    def __init__(self, base_url, session_id):
        self.base_url = base_url
        self.session_id = session_id

    def send_text(self, to, text, reply_to=None):
        """Send a text message"""
        payload = {
            "sessionId": self.session_id,
            "type": "text",
            "to": to,
            "text": text
        }
        if reply_to:
            payload["replyTo"] = reply_to

        response = requests.post(
            f"{self.base_url}/api/message/send",
            json=payload
        )
        return response.json()

    def send_image(self, to, image_url, caption=None, reply_to=None):
        """Send an image message"""
        payload = {
            "sessionId": self.session_id,
            "type": "image",
            "to": to,
            "image": image_url
        }
        if caption:
            payload["caption"] = caption
        if reply_to:
            payload["replyTo"] = reply_to

        response = requests.post(
            f"{self.base_url}/api/message/send",
            json=payload
        )
        return response.json()

    def send_image_base64(self, to, image_path, caption=None):
        """Send an image from local file"""
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode()

        payload = {
            "sessionId": self.session_id,
            "type": "image",
            "to": to,
            "image": f"data:image/jpeg;base64,{image_data}"
        }
        if caption:
            payload["caption"] = caption

        response = requests.post(
            f"{self.base_url}/api/message/send",
            json=payload
        )
        return response.json()

    def send_document(self, to, document_url, file_name, mimetype=None):
        """Send a document"""
        payload = {
            "sessionId": self.session_id,
            "type": "document",
            "to": to,
            "document": document_url,
            "fileName": file_name
        }
        if mimetype:
            payload["mimetype"] = mimetype

        response = requests.post(
            f"{self.base_url}/api/message/send",
            json=payload
        )
        return response.json()

    def send_location(self, to, latitude, longitude):
        """Send a location"""
        payload = {
            "sessionId": self.session_id,
            "type": "location",
            "to": to,
            "latitude": latitude,
            "longitude": longitude
        }

        response = requests.post(
            f"{self.base_url}/api/message/send",
            json=payload
        )
        return response.json()

# Usage
client = WhatsAppClient("http://localhost:3000", "my-session")

# Send text
result = client.send_text("628123456789", "Hello from Python!")
print(result)

# Send image
result = client.send_image(
    "628123456789",
    "https://picsum.photos/800/600",
    caption="Beautiful photo!"
)
print(result)

# Send local image
result = client.send_image_base64(
    "628123456789",
    "/path/to/image.jpg",
    caption="Check this out!"
)
print(result)

# Send document
result = client.send_document(
    "628123456789",
    "https://example.com/report.pdf",
    "Monthly Report.pdf",
    "application/pdf"
)
print(result)

# Send location
result = client.send_location("628123456789", -6.2088, 106.8456)
print(result)

# Reply to a message
result = client.send_text(
    "628123456789",
    "This is a reply!",
    reply_to="3EB0C6D3F2A4E8B9"
)
print(result)
```

---

### Node.js (axios)

```javascript
const axios = require('axios');
const fs = require('fs');

class WhatsAppClient {
  constructor(baseUrl, sessionId) {
    this.baseUrl = baseUrl;
    this.sessionId = sessionId;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async sendText(to, text, replyTo = null) {
    const payload = {
      sessionId: this.sessionId,
      type: 'text',
      to,
      text
    };
    if (replyTo) payload.replyTo = replyTo;

    const response = await this.client.post('/api/message/send', payload);
    return response.data;
  }

  async sendImage(to, image, caption = null, replyTo = null) {
    const payload = {
      sessionId: this.sessionId,
      type: 'image',
      to,
      image
    };
    if (caption) payload.caption = caption;
    if (replyTo) payload.replyTo = replyTo;

    const response = await this.client.post('/api/message/send', payload);
    return response.data;
  }

  async sendImageFromFile(to, filePath, caption = null) {
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');

    return this.sendImage(
      to,
      `data:image/jpeg;base64,${base64Image}`,
      caption
    );
  }

  async sendVideo(to, video, caption = null, replyTo = null) {
    const payload = {
      sessionId: this.sessionId,
      type: 'video',
      to,
      video
    };
    if (caption) payload.caption = caption;
    if (replyTo) payload.replyTo = replyTo;

    const response = await this.client.post('/api/message/send', payload);
    return response.data;
  }

  async sendAudio(to, audio, ptt = false, replyTo = null) {
    const payload = {
      sessionId: this.sessionId,
      type: 'audio',
      to,
      audio,
      ptt
    };
    if (replyTo) payload.replyTo = replyTo;

    const response = await this.client.post('/api/message/send', payload);
    return response.data;
  }

  async sendDocument(to, document, fileName, mimetype = null, replyTo = null) {
    const payload = {
      sessionId: this.sessionId,
      type: 'document',
      to,
      document,
      fileName
    };
    if (mimetype) payload.mimetype = mimetype;
    if (replyTo) payload.replyTo = replyTo;

    const response = await this.client.post('/api/message/send', payload);
    return response.data;
  }

  async sendLocation(to, latitude, longitude, replyTo = null) {
    const payload = {
      sessionId: this.sessionId,
      type: 'location',
      to,
      latitude,
      longitude
    };
    if (replyTo) payload.replyTo = replyTo;

    const response = await this.client.post('/api/message/send', payload);
    return response.data;
  }

  async sendContact(to, displayName, vcard, replyTo = null) {
    const payload = {
      sessionId: this.sessionId,
      type: 'contact',
      to,
      contact: { displayName, vcard }
    };
    if (replyTo) payload.replyTo = replyTo;

    const response = await this.client.post('/api/message/send', payload);
    return response.data;
  }
}

// Usage
(async () => {
  const client = new WhatsAppClient('http://localhost:3000', 'my-session');

  try {
    // Send text
    let result = await client.sendText('628123456789', 'Hello from Node.js!');
    console.log('Text sent:', result);

    // Send image
    result = await client.sendImage(
      '628123456789',
      'https://picsum.photos/800/600',
      'Beautiful photo!'
    );
    console.log('Image sent:', result);

    // Send local image
    result = await client.sendImageFromFile(
      '628123456789',
      './photo.jpg',
      'Check this out!'
    );
    console.log('Local image sent:', result);

    // Send document
    result = await client.sendDocument(
      '628123456789',
      'https://example.com/report.pdf',
      'Monthly Report.pdf',
      'application/pdf'
    );
    console.log('Document sent:', result);

    // Send location
    result = await client.sendLocation('628123456789', -6.2088, 106.8456);
    console.log('Location sent:', result);

    // Send voice note
    result = await client.sendAudio(
      '628123456789',
      'https://example.com/voice.ogg',
      true // PTT = true for voice note
    );
    console.log('Voice note sent:', result);

    // Reply to a message
    result = await client.sendText(
      '628123456789',
      'This is a reply!',
      '3EB0C6D3F2A4E8B9' // replyTo
    );
    console.log('Reply sent:', result);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
})();
```

---

### PHP (cURL)

```php
<?php

class WhatsAppClient {
    private $baseUrl;
    private $sessionId;

    public function __construct($baseUrl, $sessionId) {
        $this->baseUrl = $baseUrl;
        $this->sessionId = $sessionId;
    }

    private function sendRequest($payload) {
        $ch = curl_init($this->baseUrl . '/api/message/send');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return json_decode($response, true);
    }

    public function sendText($to, $text, $replyTo = null) {
        $payload = [
            'sessionId' => $this->sessionId,
            'type' => 'text',
            'to' => $to,
            'text' => $text
        ];
        if ($replyTo) $payload['replyTo'] = $replyTo;

        return $this->sendRequest($payload);
    }

    public function sendImage($to, $image, $caption = null, $replyTo = null) {
        $payload = [
            'sessionId' => $this->sessionId,
            'type' => 'image',
            'to' => $to,
            'image' => $image
        ];
        if ($caption) $payload['caption'] = $caption;
        if ($replyTo) $payload['replyTo'] = $replyTo;

        return $this->sendRequest($payload);
    }

    public function sendImageFromFile($to, $filePath, $caption = null) {
        $imageData = base64_encode(file_get_contents($filePath));
        $image = "data:image/jpeg;base64," . $imageData;

        return $this->sendImage($to, $image, $caption);
    }

    public function sendDocument($to, $document, $fileName, $mimetype = null, $replyTo = null) {
        $payload = [
            'sessionId' => $this->sessionId,
            'type' => 'document',
            'to' => $to,
            'document' => $document,
            'fileName' => $fileName
        ];
        if ($mimetype) $payload['mimetype'] = $mimetype;
        if ($replyTo) $payload['replyTo'] = $replyTo;

        return $this->sendRequest($payload);
    }

    public function sendLocation($to, $latitude, $longitude, $replyTo = null) {
        $payload = [
            'sessionId' => $this->sessionId,
            'type' => 'location',
            'to' => $to,
            'latitude' => $latitude,
            'longitude' => $longitude
        ];
        if ($replyTo) $payload['replyTo'] = $replyTo;

        return $this->sendRequest($payload);
    }

    public function sendContact($to, $displayName, $vcard, $replyTo = null) {
        $payload = [
            'sessionId' => $this->sessionId,
            'type' => 'contact',
            'to' => $to,
            'contact' => [
                'displayName' => $displayName,
                'vcard' => $vcard
            ]
        ];
        if ($replyTo) $payload['replyTo'] = $replyTo;

        return $this->sendRequest($payload);
    }
}

// Usage
$client = new WhatsAppClient('http://localhost:3000', 'my-session');

// Send text
$result = $client->sendText('628123456789', 'Hello from PHP!');
print_r($result);

// Send image
$result = $client->sendImage(
    '628123456789',
    'https://picsum.photos/800/600',
    'Beautiful photo!'
);
print_r($result);

// Send local image
$result = $client->sendImageFromFile(
    '628123456789',
    '/path/to/image.jpg',
    'Check this out!'
);
print_r($result);

// Send document
$result = $client->sendDocument(
    '628123456789',
    'https://example.com/report.pdf',
    'Monthly Report.pdf',
    'application/pdf'
);
print_r($result);

// Send location
$result = $client->sendLocation('628123456789', -6.2088, 106.8456);
print_r($result);

?>
```

---

## TypeScript Types

If you're building a TypeScript client, use these types:

```typescript
// Base message interface
interface BaseMessage {
  sessionId: string;
  to: string;
  replyTo?: string;
  participant?: string;
}

// Text message
interface TextMessage extends BaseMessage {
  type: 'text';
  text: string;
}

// Image message
interface ImageMessage extends BaseMessage {
  type: 'image';
  image: string; // URL or base64
  caption?: string;
}

// Video message
interface VideoMessage extends BaseMessage {
  type: 'video';
  video: string; // URL or base64
  caption?: string;
}

// Audio message
interface AudioMessage extends BaseMessage {
  type: 'audio';
  audio: string; // URL or base64
  ptt?: boolean; // Push to talk (voice note)
}

// Document message
interface DocumentMessage extends BaseMessage {
  type: 'document';
  document: string; // URL or base64
  fileName: string;
  mimetype?: string;
}

// Location message
interface LocationMessage extends BaseMessage {
  type: 'location';
  latitude: number;
  longitude: number;
}

// Contact message
interface ContactMessage extends BaseMessage {
  type: 'contact';
  contact: {
    displayName: string;
    vcard: string;
  };
}

// Union type for all message types
type MessagePayload =
  | TextMessage
  | ImageMessage
  | VideoMessage
  | AudioMessage
  | DocumentMessage
  | LocationMessage
  | ContactMessage;

// API Response
interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}
```

---

## Best Practices

### 1. **Use Clean Phone Numbers**
```javascript
// ✅ Good
{ "to": "628123456789" }

// ❌ Avoid (but still works)
{ "to": "+62 812-3456-789" }
```

### 2. **Handle Errors Gracefully**
```javascript
try {
  const result = await client.sendText('628123456789', 'Hello!');
  if (!result.success) {
    console.error('Failed to send:', result.error);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### 3. **Validate Session Before Sending**
```javascript
// Check session status first
const status = await axios.get(`${baseUrl}/api/session/${sessionId}`);
if (status.data.status !== 'connected') {
  console.error('Session not ready');
  return;
}

// Then send message
await client.sendText('628123456789', 'Hello!');
```

### 4. **Use Appropriate Media Formats**
- **Images**: JPEG, PNG (recommended: < 5MB)
- **Videos**: MP4 (recommended: < 16MB)
- **Audio**: MP3, OGG, AAC (voice notes: OGG Opus)
- **Documents**: PDF, DOCX, XLSX, TXT, etc.

### 5. **Optimize Base64 Encoding**
For large files, prefer URLs over base64 to reduce payload size and improve performance.

```javascript
// ✅ Better for large files
{ "image": "https://cdn.example.com/large-image.jpg" }

// ❌ Slower for large files
{ "image": "data:image/jpeg;base64,/9j/..." } // 5MB+ base64
```

### 6. **Reply Context**
Always include `replyTo` when you want to quote a previous message:

```javascript
// Store incoming message IDs from webhook
const incomingMessageId = webhookPayload.messageId;

// Reply to it later
await client.sendText(
  '628123456789',
  'Got your message!',
  incomingMessageId // replyTo
);
```

---

## Rate Limiting & Best Practices

### WhatsApp Rate Limits

WhatsApp has internal rate limits to prevent spam:

- **Personal accounts**: ~15-20 messages per minute
- **Business accounts**: Higher limits (varies)

### Recommendations

1. **Add delays between bulk messages**
```javascript
for (const recipient of recipients) {
  await client.sendText(recipient, 'Hello!');
  await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
}
```

2. **Implement retry logic**
```javascript
async function sendWithRetry(client, to, text, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await client.sendText(to, text);
      if (result.success) return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

3. **Queue system for bulk messaging**
Use a queue (Redis, RabbitMQ) to manage high-volume messaging:

```javascript
const Queue = require('bull');
const messageQueue = new Queue('whatsapp-messages', 'redis://127.0.0.1:6379');

// Add messages to queue
messageQueue.add({ to: '628123456789', text: 'Hello!' });

// Process queue with rate limiting
messageQueue.process(async (job) => {
  const { to, text } = job.data;
  return await client.sendText(to, text);
});

messageQueue.on('completed', (job, result) => {
  console.log(`Message sent to ${job.data.to}`);
});
```

---

## Troubleshooting

### Message Not Delivered

**Possible causes:**
1. Session disconnected → Check session status
2. Invalid phone number → Verify number is registered on WhatsApp
3. Media URL inaccessible → Check URL is publicly accessible
4. Rate limiting → Add delays between messages

### Media Failed to Send

**Solutions:**
1. Verify media URL is publicly accessible
2. Check media file size (< 16MB for videos, < 5MB for images recommended)
3. Ensure correct MIME type
4. Try base64 encoding instead of URL

### Reply Not Working

**Checklist:**
- ✅ Is `replyTo` a valid message ID?
- ✅ Is the message recent? (older messages may not work)
- ✅ For groups: Did you include `participant`?

---

## Related Documentation

- [Webhook Payload Guide](./WEBHOOK_PAYLOAD_GUIDE.md) - Understanding incoming messages
- [Session Management](./README.md) - Creating and managing sessions
- [API Reference](./API_REFERENCE.md) - Complete API documentation

---

## Support

For issues or questions:
1. Check this guide and TypeScript types in `src/types/index.ts`
2. Review error messages in API responses
3. Check server logs for detailed error information
4. Open an issue on GitHub

---

## Quick Reference

| Message Type | Required Fields | Optional Fields |
|--------------|----------------|-----------------|
| Text | `type`, `to`, `text` | `replyTo`, `participant` |
| Image | `type`, `to`, `image` | `caption`, `replyTo`, `participant` |
| Video | `type`, `to`, `video` | `caption`, `replyTo`, `participant` |
| Audio | `type`, `to`, `audio` | `ptt`, `replyTo`, `participant` |
| Document | `type`, `to`, `document`, `fileName` | `mimetype`, `replyTo`, `participant` |
| Location | `type`, `to`, `latitude`, `longitude` | `replyTo`, `participant` |
| Contact | `type`, `to`, `contact.displayName`, `contact.vcard` | `replyTo`, `participant` |
