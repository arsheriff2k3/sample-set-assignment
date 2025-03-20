import request from 'supertest';
import app from '../../index';
import InstagramService from '../../services/instagram.service';
import { llmService } from '../../services/llm.service';
import { twitterService } from '../../services/twitter.service';

jest.mock('../../services/instagram.service');
jest.mock('../../services/llm.service');
jest.mock('../../services/twitter.service');

describe('Common Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/instagram-to-twitter', () => {
    it('should fetch Instagram post, summarize caption, and post to Twitter without image', async () => {
      // Mock Instagram service response
      const mockInstagramPost = {
        caption: 'This is a test Instagram caption that is quite long and needs to be summarized',
        imageUrl: 'https://example.com/image.jpg',
        id: '12345',
        timestamp: '2023-01-01T00:00:00Z',
        likes: 100,
        postUrl: 'https://instagram.com/p/test',
      };

      const mockInstagramResponse = {
        success: true,
        data: mockInstagramPost,
      };

      const mockGetLatestPost = jest.fn().mockResolvedValue(mockInstagramResponse);
      jest.spyOn(InstagramService.prototype, 'getLatestPost').mockImplementation(mockGetLatestPost);

      // Mock LLM service response
      const mockSummary = 'This is a summarized caption';
      (llmService.summarizeText as jest.Mock).mockResolvedValue({ summary: mockSummary });

      // Mock Twitter service response
      const mockTweetId = '67890';
      const mockTweetResponse = {
        success: true,
        message: 'Tweet posted successfully',
        data: { id: mockTweetId, text: mockSummary },
      };
      (twitterService.postTweet as jest.Mock).mockResolvedValue(mockTweetResponse);

      // Make request to endpoint
      const response = await request(app)
        .post('/api/instagram-to-twitter')
        .send({ imageUpload: false });

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Successfully fetched Instagram data and posted to Twitter'
      );
      expect(response.body.data).toEqual({
        instagram: mockInstagramPost,
        twitter: {
          tweetId: mockTweetId,
          tweetText: mockSummary,
        },
      });

      // Verify service calls
      expect(InstagramService.prototype.getLatestPost).toHaveBeenCalledTimes(1);
      expect(llmService.summarizeText).toHaveBeenCalledWith({
        text: mockInstagramPost.caption,
      });
      expect(twitterService.postTweet).toHaveBeenCalledWith(mockSummary);
      expect(twitterService.postTweetWithMedia).not.toHaveBeenCalled();
    });

    it('should fetch Instagram post, summarize caption, and post to Twitter with image', async () => {
      // Mock Instagram service response
      const mockInstagramPost = {
        caption: 'This is a test Instagram caption that is quite long and needs to be summarized',
        imageUrl: 'https://example.com/image.jpg',
        id: '12345',
        timestamp: '2023-01-01T00:00:00Z',
        likes: 100,
        postUrl: 'https://instagram.com/p/test',
      };

      const mockInstagramResponse = {
        success: true,
        data: mockInstagramPost,
      };

      const mockGetLatestPost = jest.fn().mockResolvedValue(mockInstagramResponse);
      jest.spyOn(InstagramService.prototype, 'getLatestPost').mockImplementation(mockGetLatestPost);

      // Mock LLM service response
      const mockSummary = 'This is a summarized caption';
      (llmService.summarizeText as jest.Mock).mockResolvedValue({ summary: mockSummary });

      // Mock Twitter service response
      const mockTweetId = '67890';
      const mockTweetResponse = {
        success: true,
        message: 'Tweet with media posted successfully',
        data: { id: mockTweetId, text: mockSummary },
      };
      (twitterService.postTweetWithMedia as jest.Mock).mockResolvedValue(mockTweetResponse);

      // Make request to endpoint
      const response = await request(app)
        .post('/api/instagram-to-twitter')
        .send({ imageUpload: true });

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Successfully fetched Instagram data and posted to Twitter'
      );
      expect(response.body.data).toEqual({
        instagram: mockInstagramPost,
        twitter: {
          tweetId: mockTweetId,
          tweetText: mockSummary,
        },
      });

      // Verify service calls
      expect(InstagramService.prototype.getLatestPost).toHaveBeenCalledTimes(1);
      expect(llmService.summarizeText).toHaveBeenCalledWith({
        text: mockInstagramPost.caption,
      });
      expect(twitterService.postTweetWithMedia).toHaveBeenCalledWith(
        mockSummary,
        mockInstagramPost.imageUrl
      );
      expect(twitterService.postTweet).not.toHaveBeenCalled();
    });

    it('should return 404 when Instagram post fetch fails', async () => {
      // Mock Instagram service failure
      const mockInstagramResponse = {
        success: false,
        error: 'Failed to fetch Instagram post',
      };

      const mockGetLatestPost = jest.fn().mockResolvedValue(mockInstagramResponse);
      jest.spyOn(InstagramService.prototype, 'getLatestPost').mockImplementation(mockGetLatestPost);

      // Make request to endpoint
      const response = await request(app)
        .post('/api/instagram-to-twitter')
        .send({ imageUpload: false });

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to fetch Instagram post');
      expect(response.body.error).toBe('Failed to fetch Instagram post');

      // Verify service calls
      expect(InstagramService.prototype.getLatestPost).toHaveBeenCalledTimes(1);
      expect(llmService.summarizeText).not.toHaveBeenCalled();
      expect(twitterService.postTweet).not.toHaveBeenCalled();
      expect(twitterService.postTweetWithMedia).not.toHaveBeenCalled();
    });

    it('should return 400 when Twitter post fails', async () => {
      // Mock Instagram service response
      const mockInstagramPost = {
        caption: 'This is a test Instagram caption',
        imageUrl: 'https://example.com/image.jpg',
        id: '12345',
        timestamp: '2023-01-01T00:00:00Z',
        likes: 100,
        postUrl: 'https://instagram.com/p/test',
      };

      const mockInstagramResponse = {
        success: true,
        data: mockInstagramPost,
      };

      const mockGetLatestPost = jest.fn().mockResolvedValue(mockInstagramResponse);
      jest.spyOn(InstagramService.prototype, 'getLatestPost').mockImplementation(mockGetLatestPost);

      // Mock LLM service response
      const mockSummary = 'This is a summarized caption';
      (llmService.summarizeText as jest.Mock).mockResolvedValue({ summary: mockSummary });

      // Mock Twitter service failure
      const mockTweetResponse = {
        success: false,
        message: 'Failed to post tweet',
        error: 'Twitter API error',
      };
      (twitterService.postTweet as jest.Mock).mockResolvedValue(mockTweetResponse);

      // Make request to endpoint
      const response = await request(app)
        .post('/api/instagram-to-twitter')
        .send({ imageUpload: false });

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to post to Twitter');
      expect(response.body.error).toBe('Twitter API error');
      expect(response.body.data).toEqual({
        instagram: mockInstagramPost,
        summary: mockSummary,
      });

      // Verify service calls
      expect(InstagramService.prototype.getLatestPost).toHaveBeenCalledTimes(1);
      expect(llmService.summarizeText).toHaveBeenCalledWith({
        text: mockInstagramPost.caption,
      });
      expect(twitterService.postTweet).toHaveBeenCalledWith(mockSummary);
    });

    it('should return 500 when an unexpected error occurs', async () => {
      // Mock Instagram service to throw an error
      const mockError = new Error('Unexpected error');
      jest.spyOn(InstagramService.prototype, 'getLatestPost').mockRejectedValue(mockError);

      // Make request to endpoint
      const response = await request(app)
        .post('/api/instagram-to-twitter')
        .send({ imageUpload: false });

      // Assertions
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to process request');
      expect(response.body.error).toBe('Unexpected error');

      // Verify service calls
      expect(InstagramService.prototype.getLatestPost).toHaveBeenCalledTimes(1);
      expect(llmService.summarizeText).not.toHaveBeenCalled();
      expect(twitterService.postTweet).not.toHaveBeenCalled();
      expect(twitterService.postTweetWithMedia).not.toHaveBeenCalled();
    });
  });
});
