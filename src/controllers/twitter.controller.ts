import { Request, Response } from 'express';
import { llmService } from '../services/llm.service';
import { twitterService } from '../services/twitter.service';
import { MediaTweetRequest, TweetRequest } from '../interfaces/twitter.interface';
import { asyncHandler, handleValidationError, logger } from '../utils';

class TwitterController {
  constructor() {
    logger.info('Twitter controller initialized');
  }

  /**
   * Summarizes an Instagram caption and posts it as a tweet
   * @param req Request object containing the Instagram caption
   * @param res Response object
   */
  public postTweet = asyncHandler(async (req: Request, res: Response) => {
    const { instagramCaption } = req.body as TweetRequest;

    if (!instagramCaption) {
      return handleValidationError(res, 'Instagram caption is required');
    }

    const summarizationResult = await llmService.summarizeText({
      text: instagramCaption,
    });

    const tweetResult = await twitterService.postTweet(summarizationResult.summary);

    return res.status(tweetResult.success ? 200 : 400).json(tweetResult);
  });

  /**
   * Only summarizes an Instagram caption without posting it
   * @param req Request object containing the Instagram caption
   * @param res Response object
   */
  public summarizeCaption = asyncHandler(async (req: Request, res: Response) => {
    const { instagramCaption } = req.body as TweetRequest;

    if (!instagramCaption) {
      return handleValidationError(res, 'Instagram caption is required');
    }

    const summarizationResult = await llmService.summarizeText({
      text: instagramCaption,
    });

    return res.status(200).json({
      success: true,
      message: 'Caption summarized successfully',
      data: {
        tweetText: summarizationResult.summary,
      },
    });
  });

  /**
   * Summarizes an Instagram caption and posts it as a tweet with the associated image
   * @param req Request object containing the Instagram caption and image URL
   * @param res Response object
   */
  public postTweetWithMedia = asyncHandler(async (req: Request, res: Response) => {
    const { instagramCaption, imageUrl } = req.body as MediaTweetRequest;

    if (!instagramCaption || !imageUrl) {
      return handleValidationError(res, 'Both Instagram caption and image URL are required');
    }

    const summarizationResult = await llmService.summarizeText({
      text: instagramCaption,
    });

    const tweetResult = await twitterService.postTweetWithMedia(
      summarizationResult.summary,
      imageUrl
    );

    return res.status(tweetResult.success ? 200 : 400).json(tweetResult);
  });
}

export const twitterController = new TwitterController();
