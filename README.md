# Instagram Data Fetching Tool

## Overview
This application fetches Instagram data from public profiles using web scraping techniques. It's designed to work even when official Instagram API access is unavailable or limited.

## Features
- Fetches latest posts from public Instagram profiles
- Extracts captions, images, and other post metadata
- Prioritizes web scraping methods over API access
- Multiple fallback methods for reliable data retrieval
- Targets BBC News Instagram account by default

A Node.js module that fetches the latest post's caption and image URL from a specified Instagram account (default: BBC News).

## Features

- Retrieves the latest post's caption and image URL from an Instagram account
- Supports both official Instagram API and web scraping approaches
- Provides a REST API to access the data
- Includes robust error handling and logging
- Allows changing the target Instagram username

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

```