import request from 'supertest';
import app from '../../index';
import { llmService } from '../../services/llm.service';
import { twitterService } from '../../services/twitter.service';

jest.mock('../../services/llm.service');
jest.mock('../../services/twitter.service');

describe('Twitter Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/summarize', () => {
    it('should return 200 and summarized caption when successful', async () => {
      const mockSummary = 'This is a summarized caption';
      (llmService.summarizeText as jest.Mock).mockImplementation(() => {
        return Promise.resolve({ summary: mockSummary });
      });

      const response = await request(app)
        .post('/api/summarize')
        .send({ instagramCaption: 'This is a long Instagram caption that needs to be summarized' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Caption summarized successfully');
      expect(response.body.data.tweetText).toBe(mockSummary);
      expect(llmService.summarizeText).toHaveBeenCalledWith({
        text: 'This is a long Instagram caption that needs to be summarized',
      });
    });

    it('should return 400 when instagramCaption is missing', async () => {
      const response = await request(app).post('/api/summarize').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Instagram caption is required');
    });

    it('should return 500 when an error occurs during summarization', async () => {
      (llmService.summarizeText as jest.Mock).mockRejectedValue(new Error('Summarization failed'));

      const response = await request(app)
        .post('/api/summarize')
        .send({ instagramCaption: 'This is a caption' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to summarize caption');
      expect(response.body.error).toBe('Summarization failed');
    });
  });

  describe('POST /api/tweet', () => {
    it('should return 200 when tweet is posted successfully', async () => {
      const mockSummary = 'This is a summarized caption';
      (llmService.summarizeText as jest.Mock).mockImplementation(() => {
        return Promise.resolve({ summary: mockSummary });
      });

      const mockTweetResult = {
        success: true,
        message: 'Tweet posted successfully',
        data: { tweetId: '123456', tweetText: mockSummary },
      };
      (twitterService.postTweet as jest.Mock).mockResolvedValue(mockTweetResult);

      const response = await request(app)
        .post('/api/tweet')
        .send({ instagramCaption: 'This is a long Instagram caption that needs to be summarized' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTweetResult);
      expect(llmService.summarizeText).toHaveBeenCalledWith({
        text: 'This is a long Instagram caption that needs to be summarized',
      });
      expect(twitterService.postTweet).toHaveBeenCalledWith(mockSummary);
    });

    it('should return 400 when instagramCaption is missing', async () => {
      const response = await request(app).post('/api/tweet').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Instagram caption is required');
    });

    it('should return 400 when tweet posting fails', async () => {
      const mockSummary = 'This is a summarized caption';
      (llmService.summarizeText as jest.Mock).mockImplementation(() => {
        return Promise.resolve({ summary: mockSummary });
      });

      const mockTweetResult = {
        success: false,
        message: 'Failed to post tweet',
        error: 'Twitter API error',
      };
      (twitterService.postTweet as jest.Mock).mockResolvedValue(mockTweetResult);

      const response = await request(app)
        .post('/api/tweet')
        .send({ instagramCaption: 'This is a caption' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual(mockTweetResult);
    });

    it('should return 500 when an unexpected error occurs', async () => {
      (llmService.summarizeText as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/tweet')
        .send({ instagramCaption: 'This is a caption' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to process request');
      expect(response.body.error).toBe('Unexpected error');
    });
  });

  describe('POST /api/tweet-with-media', () => {
    it('should return 200 when tweet with media is posted successfully', async () => {
      const mockSummary = 'This is a summarized caption';
      (llmService.summarizeText as jest.Mock).mockImplementation(() => {
        return Promise.resolve({ summary: mockSummary });
      });

      const mockTweetResult = {
        success: true,
        message: 'Tweet with media posted successfully',
        data: { tweetId: '123456', tweetText: mockSummary },
      };
      (twitterService.postTweetWithMedia as jest.Mock).mockResolvedValue(mockTweetResult);

      const response = await request(app).post('/api/tweet-with-media').send({
        instagramCaption: 'This is a long Instagram caption that needs to be summarized',
        imageUrl: 'https://example.com/image.jpg',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTweetResult);
      expect(llmService.summarizeText).toHaveBeenCalledWith({
        text: 'This is a long Instagram caption that needs to be summarized',
      });
      expect(twitterService.postTweetWithMedia).toHaveBeenCalledWith(
        mockSummary,
        'https://example.com/image.jpg'
      );
    });

    it('should return 400 when required fields are missing', async () => {
      const response1 = await request(app)
        .post('/api/tweet-with-media')
        .send({ imageUrl: 'https://example.com/image.jpg' });

      expect(response1.status).toBe(400);
      expect(response1.body.success).toBe(false);
      expect(response1.body.error).toBe('Both Instagram caption and image URL are required');

      const response2 = await request(app)
        .post('/api/tweet-with-media')
        .send({ instagramCaption: 'This is a caption' });

      expect(response2.status).toBe(400);
      expect(response2.body.success).toBe(false);
      expect(response2.body.error).toBe('Both Instagram caption and image URL are required');
    });

    it('should return 400 when tweet with media posting fails', async () => {
      const mockSummary = 'This is a summarized caption';
      (llmService.summarizeText as jest.Mock).mockImplementation(() => {
        return Promise.resolve({ summary: mockSummary });
      });

      const mockTweetResult = {
        success: false,
        message: 'Failed to post tweet with media',
        error: 'Twitter API error',
      };
      const mockPostTweetWithMedia = jest.fn().mockResolvedValue(mockTweetResult);
      (twitterService.postTweetWithMedia as jest.Mock) = mockPostTweetWithMedia;

      const response = await request(app).post('/api/tweet-with-media').send({
        instagramCaption: 'This is a caption',
        imageUrl: 'https://example.com/image.jpg',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual(mockTweetResult);
    });

    it('should return 500 when an unexpected error occurs', async () => {
      (llmService.summarizeText as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app).post('/api/tweet-with-media').send({
        instagramCaption: 'This is a caption',
        imageUrl: 'https://example.com/image.jpg',
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to process request');
      expect(response.body.error).toBe('Unexpected error');
    });
  });
});
