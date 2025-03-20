import { Router } from 'express';
import InstagramController from '../controllers/instagram.controller';
import { twitterController } from '../controllers/twitter.controller';
import { commonController } from '../controllers/common.controller';

const router = Router();

const instagramController = new InstagramController();
/**
 * @swagger
 * /instagram/latest:
 *   post:
 *     summary: get latestpost with caption and image from instagram
 */
router.get('/instagram/latest', instagramController.getLatestPost);
/**
 * @swagger
 * /instagram/username:
 *   post:
 *     summary: change the username at runtime
 */
router.post('/instagram/username', instagramController.updateUsername);

/**
 * @swagger
 * /api/tweet:
 *   post:
 *     summary: Summarize Instagram caption and post as a tweet
 */
router.post('/tweet', twitterController.postTweet);

/**
 * @swagger
 * /api/summarize:
 *   post:
 *     summary: Summarize Instagram caption without posting
 */
router.post('/summarize', twitterController.summarizeCaption);

/**
 * @swagger
 * /api/tweet-with-media:
 *   post:
 *     summary: Summarize Instagram caption and post as a tweet with media
 */
router.post('/tweet-with-media', twitterController.postTweetWithMedia);

/**
 * @swagger
 * /api/instagram-to-twitter:
 *   post:
 *     summary: Fetch latest Instagram post, summarize caption, and post to Twitter
 *     description: Fetches the latest Instagram post, summarizes the caption, and posts to Twitter. If imageUpload is true, the image will also be posted.
 */
router.post('/instagram-to-twitter', commonController.fetchAndPostToTwitter);

export const mainRoutes = router;
