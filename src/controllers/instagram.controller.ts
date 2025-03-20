import { Request, Response } from 'express';
import InstagramService from '../services/instagram.service';
import { logger, asyncHandler, handleValidationError } from '../utils';

class InstagramController {
  private instagramService: InstagramService;

  constructor() {
    this.instagramService = new InstagramService();
    logger.info('Instagram controller initialized');
  }

  /**
   * Gets the latest post from the configured Instagram account
   * @param req - Express request object
   * @param res - Express response object
   */
  public getLatestPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Received request to get latest Instagram post');

    const result = await this.instagramService.getLatestPost();

    if (result.success && result.data) {
      logger.info('Successfully retrieved latest Instagram post');
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      logger.error(`Failed to retrieve latest Instagram post: ${result.error}`);
      res.status(404).json({
        success: false,
        error: result.error || 'Failed to retrieve latest Instagram post',
      });
    }
  });

  /**
   * Updates the target Instagram username
   * @param req - Express request object
   * @param res - Express response object
   */
  public updateUsername = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { username } = req.body;

    if (!username) {
      return handleValidationError(res, 'Username is required');
    }

    logger.info(`Received request to update Instagram username to: ${username}`);

    this.instagramService.setUsername(username);

    res.status(200).json({
      success: true,
      message: `Username updated to: ${username}`,
    });
  });
}

export default InstagramController;
