# Instagram Data Fetching and Twitter Integration Tool

## Overview
This application fetches Instagram data from public profiles using web scraping techniques and integrates with Twitter to post summarized content. It's designed to work even when official Instagram API access is unavailable or limited, and uses Google's Gemini AI to summarize Instagram captions into tweet-sized content.

## System Architecture

The application follows a modular architecture with the following components:

1. **Controllers Layer** - Handles HTTP requests and responses
   - `InstagramController`: Processes API requests for Instagram data
   - `TwitterController`: Handles Twitter integration and caption summarization
   - `CommonController`: Provides integrated workflows combining Instagram and Twitter functionality

2. **Services Layer** - Contains business logic
   - `InstagramService`: Implements multiple methods for fetching Instagram data
   - `TwitterService`: Manages Twitter API integration for posting tweets with and without media
   - `LLMService`: Provides text summarization using Google's Gemini AI

3. **Data Retrieval Methods** (in order of priority):
   - **Puppeteer Web Scraping**: Uses headless browser automation to navigate to Instagram profiles and extract data
   - **Cheerio HTML Parsing**: Uses lightweight HTML parsing to extract data from Instagram profile pages
   - **Official Instagram API**: If an access token is provided, attempts to use the official Instagram Graph API

4. **Error Handling & Logging**:
   - Comprehensive error handling with detailed logging using Winston
   - Network errors are automatically retried with exponential backoff
   - Multiple fallback methods ensure maximum reliability
   - Centralized error handling with `asyncHandler` utility that wraps controller methods
   - Standardized validation error handling with `handleValidationError` utility
   - Consistent error response format across all API endpoints

## Features
- Fetches latest posts from public Instagram profiles
- Extracts captions, images, and other post metadata
- Summarizes Instagram captions into tweet-sized content using Google's Gemini AI
- Posts summarized content to Twitter with or without media
- Integrated workflow to fetch Instagram data, summarize, and post to Twitter in one API call
- Twitter OAuth authentication support
- Prioritizes web scraping methods over API access
- Multiple fallback methods for reliable data retrieval
- Targets BBC News Instagram account by default

## Prerequisites

- Node.js (v14 or higher)
- pnpm (v6 or higher)
- Google Gemini API key
- Twitter API credentials

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
# Set your Instagram access token (if available), Google Gemini API key, Twitter credentials, and other configurations
```

## Configuration Options

The following environment variables can be configured in the `.env` file:

| Variable | Description | Default |
|----------|-------------|--------|
| `INSTAGRAM_ACCESS_TOKEN` | Instagram API access token (optional) | none |
| `TARGET_USERNAME` | Instagram username to fetch data from | bbcnews |
| `GEMINI_API_KEY` | Google Gemini API key for LLM integration | none |
| `TWITTER_API_KEY` | Twitter API key | none |
| `TWITTER_API_SECRET` | Twitter API secret | none |
| `TWITTER_ACCESS_TOKEN` | Twitter access token | none |
| `TWITTER_ACCESS_SECRET` | Twitter access token secret | none |
| `BEARER` | Twitter bearer token | none |
| `TWITTER_CLIENT_ID` | Twitter client ID for OAuth | none |
| `TWITTER_CLIENT_SECRET` | Twitter client secret for OAuth | none |
| `CALLBACK_URL` | OAuth callback URL | none |
| `PORT` | Port for the server to listen on | 3000 |
| `LOG_LEVEL` | Logging level (error, warn, info, verbose, debug, silly) | info |

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

### API Endpoints

#### Instagram Endpoints

```
GET /api/instagram/latest
```
Fetches the latest post from the configured Instagram account.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "post_id",
    "caption": "Post caption text",
    "imageUrl": "https://example.com/image.jpg",
    "timestamp": "2023-01-01T00:00:00Z",
    "likes": 100,
    "postUrl": "https://instagram.com/p/post_id"
  }
}
```

```
POST /api/instagram/username
```
Updates the target Instagram username.

**Request Body:**
```json
{
  "username": "new_username"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Username updated to: new_username"
}
```

#### Twitter Endpoints

```
POST /api/tweet
```
Summarizes an Instagram caption and posts it as a tweet.

**Request Body:**
```json
{
  "instagramCaption": "Long Instagram caption text that needs to be summarized"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tweet posted successfully",
  "data": {
    "id": "tweet_id"
  }
}
```

```
POST /api/summarize
```
Only summarizes an Instagram caption without posting it.

**Request Body:**
```json
{
  "instagramCaption": "Long Instagram caption text that needs to be summarized"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Caption summarized successfully",
  "data": {
    "tweetText": "Summarized caption text"
  }
}
```

```
POST /api/tweet-with-media
```
Summarizes an Instagram caption and posts it as a tweet with the associated image.

**Request Body:**
```json
{
  "instagramCaption": "Long Instagram caption text that needs to be summarized",
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tweet with media posted successfully",
  "data": {
    "id": "tweet_id"
  }
}
```

#### Integrated Workflow

```
POST /api/instagram-to-twitter
```
Fetches the latest Instagram post, summarizes the caption, and posts to Twitter.

**Request Body:**
```json
{
  "imageUpload": true  // Optional, defaults to false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully fetched Instagram data and posted to Twitter",
  "data": {
    "instagram": {
      "id": "post_id",
      "caption": "Post caption text",
      "imageUrl": "https://example.com/image.jpg",
      "timestamp": "2023-01-01T00:00:00Z",
      "likes": 100,
      "postUrl": "https://instagram.com/p/post_id"
    },
    "twitter": {
      "tweetId": "tweet_id",
      "tweetText": "Summarized caption text"
    }
  }
}
```

#### Authentication

```
GET /auth/twitter
```
Initiates Twitter OAuth authentication flow.

```
GET /auth/twitter/callback
```
Callback URL for Twitter OAuth authentication.

### Health Check

```
GET /health
```
Returns the health status of the application.

**Response:**
```json
{
  "status": "ok"
}
```

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error message for users",
  "error": "Technical error details"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (validation error)
- `404`: Resource not found
- `500`: Server error

## Deployment

### Docker

The application includes a Dockerfile for containerized deployment:

```bash
# Build the Docker image
docker build -t insta-data-fetching .

# Run the container
docker run -p 3000:3000 --env-file .env insta-data-fetching
```

### Environment Variables

Ensure all required environment variables are set in your deployment environment. For cloud deployments, use the platform's secrets management system to store sensitive credentials.

## Logging

The application uses Winston for logging with the following features:

- Console logging with colorized output
- File logging to `logs/error.log` for errors
- File logging to `logs/combined.log` for all log levels
- Configurable log level via the `LOG_LEVEL` environment variable

## Testing

See [TESTING.md](./TESTING.md) for detailed information about the test suite.

## License

ISC