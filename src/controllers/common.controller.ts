import { Request, Response } from 'express';
import InstagramService from '../services/instagram.service';
import { llmService } from '../services/llm.service';
import { twitterService } from '../services/twitter.service';
import { logger, asyncHandler } from '../utils';

class CommonController {
  private instagramService: InstagramService;

  constructor() {
    this.instagramService = new InstagramService();
    logger.info('Common controller initialized');
  }

  /**
   * Fetches the latest Instagram post, summarizes the caption, and posts to Twitter
   * If imageUpload is true, the image will also be posted to Twitter
   * @param req Request object containing imageUpload flag
   * @param res Response object
   */
  public fetchAndPostToTwitter = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      logger.info('Received request to fetch Instagram data and post to Twitter');

      const { imageUpload = false } = req.body;

      const instagramResult = await this.instagramService.getLatestPost();

      if (!instagramResult.success || !instagramResult.data) {
        logger.error(`Failed to fetch Instagram post: ${instagramResult.error}`);
        res.status(404).json({
          success: false,
          message: 'Failed to fetch Instagram post',
          error: instagramResult.error || 'No Instagram post found',
        });
        return;
      }

      const { caption, imageUrl } = instagramResult.data;

      const summarizationResult = await llmService.summarizeText({
        text: caption,
      });

      let tweetResult;

      if (imageUpload && imageUrl) {
        logger.info('Posting tweet with media');
        tweetResult = await twitterService.postTweetWithMedia(
          summarizationResult.summary,
          imageUrl
        );
      } else {
        logger.info('Posting tweet without media');
        tweetResult = await twitterService.postTweet(summarizationResult.summary);
      }

      if (tweetResult.success) {
        logger.info('Successfully posted to Twitter');
        res.status(200).json({
          success: true,
          message: 'Successfully fetched Instagram data and posted to Twitter',
          data: {
            instagram: instagramResult.data,
            twitter: {
              tweetId: tweetResult.data?.id,
              tweetText: summarizationResult.summary,
            },
          },
        });
      } else {
        logger.error(`Failed to post to Twitter: ${tweetResult.error}`);
        res.status(400).json({
          success: false,
          message: 'Failed to post to Twitter',
          error: tweetResult.error,
          data: {
            instagram: instagramResult.data,
            summary: summarizationResult.summary,
          },
        });
      }
    }
  );
}

export const commonController = new CommonController();
