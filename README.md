# Instagram Data Fetching Tool

## Overview
This application fetches Instagram data from public profiles using web scraping techniques. It's designed to work even when official Instagram API access is unavailable or limited.

## Features
- Fetches latest posts from public Instagram profiles
- Extracts captions, images, and other post metadata
- Prioritizes web scraping methods over API access
- Multiple fallback methods for reliable data retrieval
- Targets BBC News Instagram account by default

## Prerequisites

- Node.js (v14 or higher)
- pnpm (v6 or higher)

## Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file based on the `.env.example` template:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the file with your preferred editor
# Set your Instagram access token (if available) and other configurations
```

## Usage

### Starting the Server

```bash
# Build the TypeScript code
pnpm build

# Start the server
pnpm start

# For development with auto-reload
pnpm dev
```

The server will start on port 3000 by default (configurable in .env).

### API Endpoints

#### Get Latest Instagram Post

```
GET /api/instagram/latest
```

Returns the latest post from the configured Instagram account (default: BBC News).

**Response Example:**

```json
{
  "success": true,
  "data": {
    "caption": "Latest post caption from BBC News",
    "imageUrl": "https://instagram.com/p/image-url.jpg",
    "timestamp": "2023-01-01T12:00:00Z",
    "postUrl": "https://instagram.com/p/post-id/"
  }
}
```

#### Change Target Instagram Username

```
POST /api/instagram/username
```

**Request Body:**

```json
{
  "username": "new_instagram_username"
}
```

**Response Example:**

```json
{
  "success": true,
  "message": "Username updated to: new_instagram_username"
}
```

## How It Works

The module uses multiple methods to fetch Instagram data:

1. **Puppeteer Web Scraping** (Primary Method): Uses headless browser automation to navigate to Instagram profiles and extract data.

2. **Cheerio HTML Parsing** (Fallback Method): Uses lightweight HTML parsing to extract data from Instagram profile pages.

3. **Official Instagram API** (Last Resort): If an access token is provided, attempts to use the official Instagram Graph API.

## Changing the Target Instagram Username

You can change the target Instagram username in two ways:

1. **Environment Variable**: Set the `TARGET_USERNAME` in your `.env` file.

2. **API Endpoint**: Use the `/api/instagram/username` endpoint to change the username at runtime.

## Error Handling

The module includes comprehensive error handling with detailed logging:

- Network errors are automatically retried with exponential backoff
- Multiple fallback methods ensure maximum reliability
- All errors are logged to console and log files
- Detailed error responses are provided through the API