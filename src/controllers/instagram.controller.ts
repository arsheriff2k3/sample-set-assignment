import { Request, Response } from 'express';
import InstagramService from '../services/instagram.service';
import logger from '../utils/logger';

/**
 * Controller class for handling Instagram-related HTTP requests
 */
class InstagramController {
  private instagramService: InstagramService;

  /**
   * Creates an instance of InstagramController
   */
  constructor() {
    this.instagramService = new InstagramService();
    logger.info('Instagram controller initialized');
  }

  /**
   * Gets the latest post from the configured Instagram account
   * @param req - Express request object
   * @param res - Express response object
   */
  public getLatestPost = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Received request to get latest Instagram post');
      
      const result = await this.instagramService.getLatestPost();
      
      if (result.success && result.data) {
        logger.info('Successfully retrieved latest Instagram post');
        res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        logger.error(`Failed to retrieve latest Instagram post: ${result.error}`);
        res.status(404).json({
          success: false,
          error: result.error || 'Failed to retrieve latest Instagram post'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error in getLatestPost controller: ${errorMessage}`);
      res.status(500).json({
        success: false,
        error: `Server error: ${errorMessage}`
      });
    }
  };

  /**
   * Updates the target Instagram username
   * @param req - Express request object
   * @param res - Express response object
   */
  public updateUsername = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username } = req.body;
      
      if (!username) {
        logger.warn('Missing username in request body');
        res.status(400).json({
          success: false,
          error: 'Username is required'
        });
        return;
      }
      
      logger.info(`Received request to update Instagram username to: ${username}`);
      
      this.instagramService.setUsername(username);
      
      res.status(200).json({
        success: true,
        message: `Username updated to: ${username}`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error in updateUsername controller: ${errorMessage}`);
      res.status(500).json({
        success: false,
        error: `Server error: ${errorMessage}`
      });
    }
  };
}

export default InstagramController;