import request from 'supertest';
import app from '../../index';
import InstagramService from '../../services/instagram.service';

jest.mock('../../services/instagram.service');

describe('Instagram Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/instagram/latest', () => {
    it('should return 200 and latest post data when successful', async () => {
      const mockPost = {
        id: 'test-id',
        caption: 'Test caption',
        imageUrl: 'https://example.com/image.jpg',
        timestamp: '2023-01-01T00:00:00Z',
        likes: 100,
        postUrl: 'https://instagram.com/p/test',
      };

      const mockResponse = {
        success: true,
        data: mockPost,
      };

      const mockGetLatestPost = jest.fn().mockResolvedValue(mockResponse);
      jest.spyOn(InstagramService.prototype, 'getLatestPost').mockImplementation(mockGetLatestPost);

      const response = await request(app).get('/api/instagram/latest');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPost);
      expect(mockGetLatestPost).toHaveBeenCalledTimes(1);
    });

    it('should return 404 when post is not found', async () => {
      const mockResponse = {
        success: false,
        error: 'Post not found',
      };

      const mockGetLatestPost = jest.fn().mockResolvedValue(mockResponse);
      jest.spyOn(InstagramService.prototype, 'getLatestPost').mockImplementation(mockGetLatestPost);

      const response = await request(app).get('/api/instagram/latest');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Post not found');
      expect(mockGetLatestPost).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when an unexpected error occurs', async () => {
      const mockGetLatestPost = jest.fn().mockRejectedValue(new Error('Server error'));
      jest.spyOn(InstagramService.prototype, 'getLatestPost').mockImplementation(mockGetLatestPost);

      const response = await request(app).get('/api/instagram/latest');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Server error');
      expect(mockGetLatestPost).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/instagram/username', () => {
    it('should return 200 when username is updated successfully', async () => {
      const mockSetUsername = jest.fn();
      jest.spyOn(InstagramService.prototype, 'setUsername').mockImplementation(mockSetUsername);

      const response = await request(app)
        .post('/api/instagram/username')
        .send({ username: 'testuser' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('testuser');
      expect(mockSetUsername).toHaveBeenCalledWith('testuser');
    });

    it('should return 400 when username is missing', async () => {
      const response = await request(app).post('/api/instagram/username').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username is required');
    });

    it('should return 500 when an unexpected error occurs', async () => {
      const mockSetUsername = jest.fn().mockImplementation(() => {
        throw new Error('Server error');
      });
      jest.spyOn(InstagramService.prototype, 'setUsername').mockImplementation(mockSetUsername);

      const response = await request(app)
        .post('/api/instagram/username')
        .send({ username: 'testuser' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Server error');
      expect(mockSetUsername).toHaveBeenCalledWith('testuser');
    });
  });
});
