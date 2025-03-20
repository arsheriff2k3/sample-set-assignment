# Testing Documentation

## Overview

This document provides detailed information about the test suite for the Instagram Data Fetching and Twitter Integration Tool. It covers unit tests and integration tests for all major components of the application.

## Test Environment Setup

### Prerequisites

- Node.js (v14 or higher)
- pnpm (v6 or higher)
- Jest testing framework

### Setting Up the Test Environment

1. Install dependencies:

```bash
pnpm install
```

2. The test environment uses environment variables defined in `jest.setup.js`. These are automatically loaded during testing and include:

```javascript
// Set up environment variables for testing
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.INSTAGRAM_ACCESS_TOKEN = 'test-token';
process.env.TARGET_USERNAME = 'bbcnews';
process.env.TWITTER_API_KEY = 'test-twitter-key';
process.env.TWITTER_API_SECRET = 'test-twitter-secret';
process.env.TWITTER_ACCESS_TOKEN = 'test-twitter-token';
process.env.TWITTER_ACCESS_SECRET = 'test-twitter-secret';
process.env.BEARER = 'test-bearer-token';
```

## Running Tests

### Running All Tests

```bash
pnpm test
```

### Running Tests with Coverage

```bash
pnpm test:coverage
```

### Running Tests in Watch Mode

```bash
pnpm test:watch
```

## Test Structure

The test suite is organized to mirror the application structure:

```
src/
  __tests__/
    controllers/
      common.controller.test.ts
      instagram.controller.test.ts
      twitter.controller.test.ts
```

## Test Cases

### Error Handling Utilities Tests

Location: `src/__tests__/utils/errorHandler.test.ts`

#### AsyncHandler Tests

- **Should handle successful async operations**
  - Expected outcome: Function executes successfully and returns expected result

- **Should catch and format errors from async operations**
  - Expected outcome: Errors are caught, logged, and formatted into standardized response

- **Should handle ApiError with custom status codes**
  - Expected outcome: Response includes the correct status code from the ApiError

#### Validation Error Handler Tests

- **Should return properly formatted validation errors**
  - Expected outcome: Returns 400 status code with standardized error format

- **Should include custom status code when provided**
  - Expected outcome: Returns the provided status code with standardized error format

### Instagram Service Tests

Location: `src/__tests__/services/instagram.service.test.ts`

#### Constructor Tests

- **Should initialize with default username if not provided**
  - Expected outcome: Service initializes with 'bbcnews' as the default username

- **Should initialize with provided username**
  - Expected outcome: Service initializes with the provided username

- **Should initialize with access token from environment if not provided**
  - Expected outcome: Service initializes with the access token from environment variables

#### Username Setting Tests

- **Should update the username**
  - Expected outcome: Username is updated to the new value

#### Data Retrieval Tests

- **Should return data from API when API call is successful**
  - Expected outcome: Returns formatted Instagram post data from the API

- **Should return data from Puppeteer when API call fails**
  - Expected outcome: Returns formatted Instagram post data from Puppeteer scraping

- **Should return data from Cheerio when both API and Puppeteer fail**
  - Expected outcome: Returns formatted Instagram post data from Cheerio HTML parsing

- **Should return error when all methods fail**
  - Expected outcome: Returns error response

### LLM Service Tests

Location: `src/__tests__/services/llm.service.test.ts`

#### Text Summarization Tests

- **Should summarize text successfully**
  - Expected outcome: Returns summarized text from the LLM

- **Should truncate summary to maxLength if specified**
  - Expected outcome: Returns summarized text truncated to the specified maximum length

- **Should throw an error when API call fails**
  - Expected outcome: Throws an error with appropriate message

- **Should throw an error when GEMINI_API_KEY is not defined**
  - Expected outcome: Throws an error about missing API key

- **Should handle long texts appropriately**
  - Expected outcome: Successfully summarizes long texts within the character limit

### Twitter Service Tests

Location: `src/__tests__/services/twitter.service.test.ts`

#### Tweet Posting Tests

- **Should post tweet successfully**
  - Expected outcome: Returns success response with tweet ID

- **Should return error when tweet exceeds character limit**
  - Expected outcome: Returns error response with appropriate message

- **Should return error when Twitter API fails**
  - Expected outcome: Returns error response

#### Tweet with Media Tests

- **Should post tweet with media successfully**
  - Expected outcome: Returns success response with tweet ID

- **Should download and process image correctly**
  - Expected outcome: Image is downloaded, processed, and uploaded to Twitter

- **Should clean up temporary image files after posting**
  - Expected outcome: Temporary image files are deleted after successful or failed posting

- **Should return error when media upload fails**
  - Expected outcome: Returns error response

### Common Controller Tests

Location: `src/__tests__/controllers/common.controller.test.ts`

#### Integrated Workflow Tests

- **Should fetch Instagram post, summarize, and post to Twitter successfully**
  - Test setup:
    - Mock Instagram service to return successful response with caption and image URL
    - Mock LLM service to return successful summarization
    - Mock Twitter service to return successful tweet posting
  - Request: `POST /instagram-to-twitter` with `{"imageUpload": false}`
  - Expected outcome: 200 status code with success response containing Instagram data and Twitter post ID

- **Should fetch Instagram post, summarize, and post to Twitter with media successfully**
  - Test setup:
    - Mock Instagram service to return successful response with caption and image URL
    - Mock LLM service to return successful summarization
    - Mock Twitter service to return successful tweet with media posting
  - Request: `POST /instagram-to-twitter` with `{"imageUpload": true}`
  - Expected outcome: 200 status code with success response containing Instagram data and Twitter post ID

- **Should return error when Instagram service fails**
  - Test setup:
    - Mock Instagram service to return error response
  - Request: `POST /instagram-to-twitter`
  - Expected outcome: 404 status code with error response

- **Should return error when Twitter service fails**
  - Test setup:
    - Mock Instagram service to return successful response with caption and image URL
    - Mock LLM service to return successful summarization
    - Mock Twitter service to return error response
  - Request: `POST /instagram-to-twitter`
  - Expected outcome: 400 status code with error response containing Instagram data and summary

- **Should handle unexpected errors gracefully**
  - Test setup:
    - Mock Instagram service to throw an unexpected error
  - Request: `POST /instagram-to-twitter`
  - Expected outcome: 500 status code with error response

### Instagram Controller Tests

Location: `src/__tests__/controllers/instagram.controller.test.ts`

#### Get Latest Post Tests

- **Should return 200 and latest post data when successful**
  - Test setup: Mock Instagram service to return successful response
  - Request: `GET /api/instagram/latest`
  - Expected outcome: 200 status code with post data

- **Should return 404 when post is not found**
  - Test setup: Mock Instagram service to return error response
  - Request: `GET /api/instagram/latest`
  - Expected outcome: 404 status code with error message

- **Should return 500 when an unexpected error occurs**
  - Test setup: Mock Instagram service to throw an error
  - Request: `GET /api/instagram/latest`
  - Expected outcome: 500 status code with error message

#### Update Username Tests

- **Should return 200 when username is updated successfully**
  - Test setup: Mock Instagram service's setUsername method
  - Request: `POST /api/instagram/username` with username
  - Expected outcome: 200 status code with success message

- **Should return 400 when username is missing**
  - Test setup: No mocking required
  - Request: `POST /api/instagram/username` with empty body
  - Expected outcome: 400 status code with validation error

### Twitter Controller Tests

Location: `src/__tests__/controllers/twitter.controller.test.ts`

#### Post Tweet Tests

- **Should return 200 when tweet is posted successfully**
  - Test setup:
    - Mock LLM service to return successful summarization
    - Mock Twitter service to return successful tweet posting
  - Request: `POST /api/tweet` with Instagram caption
  - Expected outcome: 200 status code with tweet ID

- **Should return 400 when Instagram caption is missing**
  - Test setup: No mocking required
  - Request: `POST /api/tweet` with empty body
  - Expected outcome: 400 status code with validation error

- **Should return 400 when Twitter service fails**
  - Test setup:
    - Mock LLM service to return successful summarization
    - Mock Twitter service to return error response
  - Request: `POST /api/tweet` with Instagram caption
  - Expected outcome: 400 status code with error message

#### Summarize Caption Tests

- **Should return 200 when caption is summarized successfully**
  - Test setup: Mock LLM service to return successful summarization
  - Request: `POST /api/summarize` with Instagram caption
  - Expected outcome: 200 status code with summarized text

- **Should return 400 when Instagram caption is missing**
  - Test setup: No mocking required
  - Request: `POST /api/summarize` with empty body
  - Expected outcome: 400 status code with validation error

#### Post Tweet with Media Tests

- **Should return 200 when tweet with media is posted successfully**
  - Test setup:
    - Mock LLM service to return successful summarization
    - Mock Twitter service to return successful tweet with media posting
  - Request: `POST /api/tweet-with-media` with Instagram caption and image URL
  - Expected outcome: 200 status code with tweet ID

- **Should return 400 when Instagram caption or image URL is missing**
  - Test setup: No mocking required
  - Request: `POST /api/tweet-with-media` with incomplete body
  - Expected outcome: 400 status code with validation error

## Mocking Strategy

The test suite uses Jest's mocking capabilities to isolate components during testing:

- **Service Mocks**: Controllers are tested with mocked service responses
- **External API Mocks**: Services that call external APIs (Twitter, Instagram, Google Gemini) use mocked responses
- **File System Mocks**: Operations that interact with the file system are mocked

## Test Coverage

The test suite aims for high coverage across all components:

- **Controllers**: 95%+ coverage
- **Services**: 90%+ coverage
- **Utilities**: 95%+ coverage
- **Error Handling**: 100% coverage

To view detailed coverage reports:

```bash
pnpm test:coverage
```

This will generate a coverage report in the `coverage` directory that can be viewed in a browser.

## Testing Best Practices

1. **Isolation**: Each test should be independent and not rely on the state from other tests
2. **Mocking**: External dependencies should be mocked to ensure tests are reliable and fast
3. **Error Cases**: Test both success and error scenarios for each component
4. **Edge Cases**: Include tests for edge cases like empty inputs, large inputs, and invalid inputs
5. **Readability**: Tests should be clear about what they're testing and what the expected outcome is

## Continuous Integration

Tests are automatically run in the CI/CD pipeline on each pull request and before deployment to ensure code quality and prevent regressions.

## Troubleshooting Tests

### Common Issues

1. **Timeouts**: Tests involving Puppeteer may time out. Increase the timeout in `jest.config.js` if needed.
2. **Environment Variables**: Ensure all required environment variables are set in `jest.setup.js`.
3. **Mocking Issues**: If tests fail due to mocking issues, check that the mock implementation matches the expected interface.

### Debugging Tests

To debug tests, use the following approaches:

1. **Console Logging**: Add console.log statements to see values during test execution
2. **Jest --verbose**: Run tests with the `--verbose` flag for more detailed output
3. **Node Inspector**: Use Node's built-in debugger with `--inspect` flag