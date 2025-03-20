import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { Stream } from 'stream';

dotenv.config();

class TwitterService {
  private client: TwitterApi;
  private tempDir: string;

  constructor() {
    const apiKey = process.env.TWITTER_API_KEY || '';
    const apiSecret = process.env.TWITTER_API_SECRET || '';
    const accessToken = process.env.TWITTER_ACCESS_TOKEN || '';
    const accessSecret = process.env.TWITTER_ACCESS_SECRET || '';

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      logger.error('Twitter API credentials are missing');
      throw new Error('Twitter API credentials are missing');
    }

    logger.info('Twitter service initialized');

    this.client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    this.tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async postTweet(tweetText: string) {
    try {
      logger.info(
        `Attempting to post tweet: ${tweetText.substring(0, 30)}${tweetText.length > 30 ? '...' : ''}`
      );

      if (tweetText.length > 280) {
        logger.warn(`Tweet exceeds character limit: ${tweetText.length} characters`);
        return {
          success: false,
          message: 'Tweet exceeds character limit',
          error: 'Tweet must be 280 characters or less',
        };
      }

      const response = await this.client.v2.tweet(tweetText);
      logger.info(`Tweet posted successfully with ID: ${response.data.id}`);
      return {
        success: true,
        message: 'Tweet posted successfully',
        data: response.data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error posting tweet: ${errorMessage}`);
      return { success: false, message: 'Failed to post tweet', error: errorMessage };
    }
  }

  /**
   * Downloads an image from a URL and saves it temporarily
   * @param imageUrl URL of the image to download
   * @returns Path to the downloaded image
   */
  private async downloadImage(imageUrl: string): Promise<string> {
    try {
      logger.info(`Downloading image from: ${imageUrl.substring(0, 30)}...`);
      const imagePath = path.join(this.tempDir, `${uuidv4()}.jpg`);
      const writer = fs.createWriteStream(imagePath);

      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream',
      });

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          logger.info(`Image downloaded successfully to: ${imagePath}`);
          resolve(imagePath);
        });
        writer.on('error', (err: Error) => {
          logger.error(`Error writing image to file: ${err.message}`);
          reject(err);
        });
        (response.data as Stream).on('error', (err: Error) => {
          logger.error(`Error in image download stream: ${err.message}`);
          reject(err);
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error downloading image: ${errorMessage}`);
      throw new Error(`Failed to download image: ${errorMessage}`);
    }
  }

  /**
   * Posts a tweet with an image
   * @param tweetText The text content of the tweet
   * @param imageUrl URL of the image to include in the tweet
   * @returns Result of the tweet posting operation
   */
  async postTweetWithMedia(tweetText: string, imageUrl: string) {
    let imagePath: string | null = null;

    try {
      logger.info(
        `Attempting to post tweet with media: ${tweetText.substring(0, 30)}${tweetText.length > 30 ? '...' : ''}`
      );

      if (tweetText.length > 280) {
        logger.warn(`Tweet exceeds character limit: ${tweetText.length} characters`);
        return {
          success: false,
          message: 'Tweet exceeds character limit',
          error: 'Tweet must be 280 characters or less',
        };
      }

      imagePath = await this.downloadImage(imageUrl);
      logger.info('Uploading media to Twitter');

      const mediaId = await this.client.v1.uploadMedia(imagePath);
      logger.info(`Media uploaded successfully with ID: ${mediaId}`);

      const response = await this.client.v2.tweet({
        text: tweetText,
        media: { media_ids: [mediaId] },
      });

      logger.info(`Tweet with media posted successfully with ID: ${response.data.id}`);
      return {
        success: true,
        message: 'Tweet with media posted successfully',
        data: response.data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error posting tweet with media: ${errorMessage}`);
      return {
        success: false,
        message: 'Failed to post tweet with media',
        error: errorMessage,
      };
    } finally {
      if (imagePath && fs.existsSync(imagePath)) {
        logger.debug(`Cleaning up temporary image file: ${imagePath}`);
        fs.unlinkSync(imagePath);
      }
    }
  }
}

export const twitterService = new TwitterService();
