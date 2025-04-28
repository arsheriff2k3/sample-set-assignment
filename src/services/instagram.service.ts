import axios from 'axios';
import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import logger from '../utils/logger';
import {
  InstagramConfig,
  InstagramPost,
  InstagramResponse,
} from '../interfaces/instagram.interface';
import dotenv from 'dotenv';
import * as fs from 'fs';
import { getChromePath } from 'chrome-launcher';

dotenv.config();

class InstagramService {
  private config: InstagramConfig;

  /**
   * Creates an instance of InstagramService
   * Configured to prioritize web scraping methods over API access
   * @param config - Configuration for the Instagram service
   */
  constructor(config?: Partial<InstagramConfig>) {
    this.config = {
      // Default to bbcnews if no username is provided
      username: config?.username || process.env.TARGET_USERNAME || 'bbcnews',
      accessToken: config?.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN,
    };

    logger.info(`Instagram service initialized for username: ${this.config.username}`);
    logger.info('Service configured to prioritize web scraping over API access');
  }

  /**
   * Updates the target Instagram username
   * @param username - The new username to fetch data from
   */
  public setUsername(username: string): void {
    this.config.username = username;
    logger.info(`Target username updated to: ${username}`);
  }

  /**
   * Attempts to fetch the latest Instagram post using the official API
   * @returns Promise with Instagram response
   */
  private async fetchViaApi(): Promise<InstagramResponse> {
    try {
      if (!this.config.accessToken) {
        logger.warn('No Instagram access token provided, skipping API method');
        return {
          success: false,
          error: 'No Instagram access token provided',
        };
      }

      logger.info('Attempting to fetch Instagram data via official API');

      const response = await axios.get(
        `https://graph.instagram.com/me/media?fields=id,caption,media_url,permalink,timestamp&access_token=${this.config.accessToken}`
      );

      if (response.data && response.data.data && response.data.data.length > 0) {
        const latestPost = response.data.data[0];

        const post: InstagramPost = {
          id: latestPost.id,
          caption: latestPost.caption || 'No caption',
          imageUrl: latestPost.media_url,
          timestamp: latestPost.timestamp,
          postUrl: latestPost.permalink,
        };

        logger.info(`Successfully fetched latest post via API for ${this.config.username}`);
        return { success: true, data: post };
      } else {
        logger.warn('No posts found via API');
        return {
          success: false,
          error: 'No posts found',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching Instagram data via API: ${errorMessage}`);
      return {
        success: false,
        error: `API error: ${errorMessage}`,
      };
    }
  }

  /**
   * Fetches the latest Instagram post using Puppeteer for web scraping
   * @returns Promise with Instagram response
   */
  private async fetchViaPuppeteer(): Promise<InstagramResponse> {
    let browser = null;
    try {
      logger.info(`Attempting to fetch Instagram data via Puppeteer for ${this.config.username}`);


      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: getChromePath(),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
          '--disable-web-security',
          '--window-size=1920,1080',
        ],
      });


      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      });

      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });

      page.on('console', msg => {
        logger.debug(`Browser console: ${msg.text()}`);
      });

      page.on('error', err => {
        logger.error(`Page error: ${err.message}`);
      });

      logger.info(`Navigating to Instagram profile: ${this.config.username}`);

      try {
        await page.goto(`https://www.instagram.com/${this.config.username}/`, {
          waitUntil: 'networkidle2',
          timeout: 120000,
        });
      } catch (error) {
        logger.warn(
          `Navigation with networkidle2 failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        logger.info('Retrying with domcontentloaded wait condition');

        await page.goto(`https://www.instagram.com/${this.config.username}/`, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
      }

      await page.screenshot({ path: 'logs/instagram-profile.png' });

      await page.waitForTimeout(5000 + Math.floor(Math.random() * 3000));

      try {
        const cookieButton = await page.$('button[tabindex="0"][type="button"]:not([disabled])');
        if (cookieButton) {
          logger.info('Detected possible cookie consent button, attempting to click');
          await cookieButton.click();
          await page.waitForTimeout(2000);
        }
      } catch (error) {
        logger.info('No cookie consent button found or error clicking it');
      }

      const postSelectors = [
        'article a, a[href*="/p/"]',
        'a[href*="/p/"]',
        'div[role="button"] a',
        'main article a',
        'div._aagw a',
        'div._aabd a',
        'div[class*="_aa"] a[href*="/p/"]',
        'a[role="link"][tabindex="0"][href*="/p/"]',
        'main a[href^="/p/"]',
        'div[role="presentation"] a[href^="/p/"]',
      ];

      let foundSelector = false;
      let workingSelector = '';

      for (const selector of postSelectors) {
        try {
          logger.info(`Trying selector: ${selector}`);
          await page.waitForSelector(selector, { timeout: 8000 });
          foundSelector = true;
          workingSelector = selector;
          logger.info(`Found working selector: ${selector}`);
          break;
        } catch (error) {
          logger.warn(`Selector ${selector} not found, trying next`);
        }
      }

      if (!foundSelector) {
        await page.screenshot({ path: 'logs/instagram-no-posts.png' });
        throw new Error('No posts found on the profile after trying all selectors');
      }

      const postLinks = await page.$$eval(workingSelector, links => {
        return links
          .map(link => (link as HTMLAnchorElement).href)
          .filter(href => href && href.includes('/p/'));
      });

      if (postLinks.length === 0) {
        throw new Error('No post links found on the page');
      }

      logger.info(`Found ${postLinks.length} post links, using the first one`);

      await page.goto(postLinks[0], {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      logger.info('Navigated to post page directly');

      await page.screenshot({ path: 'logs/instagram-post.png' });

      await page.waitForTimeout(2000 + Math.floor(Math.random() * 1500));

      const postPageSelectors = [
        'article[role="presentation"]',
        'div[role="dialog"]',
        'main article',
        'div._aatk',
        'div[class*="_aa"]',
        'section main',
      ];

      foundSelector = false;
      for (const selector of postPageSelectors) {
        try {
          logger.info(`Trying post page selector: ${selector}`);
          await page.waitForSelector(selector, { timeout: 5000 });
          foundSelector = true;
          logger.info(`Found working post page selector: ${selector}`);
          break;
        } catch (error) {
          logger.warn(`Post page selector ${selector} not found, trying next`);
        }
      }

      if (!foundSelector) {
        throw new Error('Post page elements not found after trying all selectors');
      }

      const postData = await page.evaluate(() => {
        const captionSelectors = [
          'div[role="dialog"] ul li span',
          'article[role="presentation"] ul li span',
          'div[role="dialog"] h1 + div span',
          'article div._a9zs span',
          'h1 + div span',
          'div._a9zs span',
          'span[dir="auto"]',
          'div._ae5q span',
          'div[class*="_ae"] span',
          'div[class*="_aa"] span[dir="auto"]',
          'ul li span[dir="auto"]',
        ];

        let captionElement = null;
        for (const selector of captionSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            for (let i = 0; i < elements.length; i++) {
              const text = elements[i].textContent;
              if (text && text.length > 5) {
                captionElement = elements[i];
                break;
              }
            }
            if (captionElement) break;
          }
        }

        const imageSelectors = [
          'div[role="dialog"] img[decoding="auto"]',
          'article[role="presentation"] img[decoding="auto"]',
          'div[role="dialog"] img[crossorigin="anonymous"]',
          'article div._aagv img',
          'article img',
          'div._aagv img',
          'div[class*="_aa"] img',
          'div[class*="_ab"] img',
          'img[crossorigin="anonymous"]',
          'img[alt]',
          'img[style*="object-fit"]',
        ];

        let imageElement = null;
        for (const selector of imageSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            imageElement = elements[0];
            break;
          }
        }

        const timeSelectors = ['time', 'time[datetime]', 'div[class*="_aa"] time', 'a time'];

        let timeElement = null;
        for (const selector of timeSelectors) {
          timeElement = document.querySelector(selector);
          if (timeElement) break;
        }

        const timestamp = timeElement ? (timeElement as HTMLTimeElement).dateTime : null;

        const postUrl = window.location.href;

        return {
          caption: captionElement ? captionElement.textContent || 'No caption' : 'No caption',
          imageUrl: imageElement ? imageElement.getAttribute('src') || '' : '',
          postUrl: postUrl,
          timestamp: timestamp,
        };
      });

      logger.info(`Extracted post data: ${JSON.stringify(postData)}`);

      if (!postData.imageUrl) {
        logger.info('Could not extract image URL with selectors, trying alternative approach');

        const allImages = await page.$$eval('img', imgs => {
          return imgs.map(img => ({
            src: img.getAttribute('src'),
            width: img.width,
            height: img.height,
            alt: img.getAttribute('alt') || '',
          }));
        });

        const likelyPostImages = allImages.filter(
          img => img.width > 300 && img.height > 300 && img.src && img.src.includes('instagram')
        );

        if (likelyPostImages.length > 0) {
          logger.info(`Found ${likelyPostImages.length} potential post images`);
          postData.imageUrl =
            likelyPostImages[0].src !== null && likelyPostImages[0].src !== undefined
              ? likelyPostImages[0].src
              : '';
        } else {
          throw new Error('Could not extract image URL from the post');
        }
      }

      const post: InstagramPost = {
        caption: postData.caption,
        imageUrl: postData.imageUrl,
        postUrl: postData.postUrl,
        timestamp: postData.timestamp || '',
      };

      logger.info(`Successfully fetched latest post via Puppeteer for ${this.config.username}`);
      return { success: true, data: post };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching Instagram data via Puppeteer: ${errorMessage}`);
      return {
        success: false,
        error: `Puppeteer error: ${errorMessage}`,
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Fetches the latest Instagram post using Cheerio for web scraping
   * @returns Promise with Instagram response
   */
  private async fetchViaCheerio(): Promise<InstagramResponse> {
    try {
      logger.info(`Attempting to fetch Instagram data via Cheerio for ${this.config.username}`);

      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      ];

      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

      logger.info(`Using user agent: ${userAgent}`);

      const maxRetries = 3;
      let retryCount = 0;
      let html = '';

      while (retryCount < maxRetries) {
        try {
          logger.info(`Attempt ${retryCount + 1} to fetch Instagram profile`);

          const response = await axios.get(`https://www.instagram.com/${this.config.username}/`, {
            headers: {
              'User-Agent': userAgent,
              'Accept-Language': 'en-US,en;q=0.9',
              Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
              'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
              'sec-ch-ua-mobile': '?0',
              'sec-ch-ua-platform': '"Windows"',
              'sec-fetch-dest': 'document',
              'sec-fetch-mode': 'navigate',
              'sec-fetch-site': 'none',
              'sec-fetch-user': '?1',
              'upgrade-insecure-requests': '1',
            },
            timeout: 30000,
            maxRedirects: 5,
          });

          if (response.data) {
            html = response.data;
            logger.info('HTML fetched successfully');
            break;
          } else {
            throw new Error('Empty response received');
          }
        } catch (error) {
          retryCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.warn(`Attempt ${retryCount} failed: ${errorMessage}`);

          if (retryCount >= maxRetries) {
            throw new Error(`Failed after ${maxRetries} attempts: ${errorMessage}`);
          }

          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
          logger.info(`Retrying in ${Math.round(delay / 1000)} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      fs.writeFileSync('logs/instagram-profile.html', html);
      logger.info('Saved HTML to logs/instagram-profile.html for debugging');

      if (!html || typeof html !== 'string' || html.trim().length === 0) {
        throw new Error('Invalid HTML content received');
      }

      let $;
      try {
        $ = cheerio.load(html);
        logger.info('HTML loaded successfully with Cheerio');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to parse HTML with Cheerio: ${errorMessage}`);
      }

      logger.info('Searching for data patterns in HTML');

      // Approach 1: Try to extract the shared data JSON
      const scriptTags = $('script').filter(function () {
        const text = $(this).text() || '';
        return (
          text.includes('window._sharedData') ||
          text.includes('__d("InstagramWebSharedData"') ||
          text.includes('window.__additionalDataLoaded')
        );
      });

      logger.info(`Found ${scriptTags.length} potential script tags with data`);

      if (scriptTags.length === 0) {
        logger.warn('Could not find any data scripts, trying alternative approach');
      } else {
        for (let i = 0; i < scriptTags.length; i++) {
          try {
            const scriptContent = $(scriptTags[i]).html() || '';

            let jsonData = null;

            const sharedDataMatch = scriptContent.match(/window\._sharedData = (.+);/);
            if (sharedDataMatch && sharedDataMatch.length >= 2) {
              jsonData = JSON.parse(sharedDataMatch[1]);
              logger.info('Found data in window._sharedData');
            }

            if (!jsonData) {
              const additionalDataMatch = scriptContent.match(
                /window\.__additionalDataLoaded\([^,]+,(.+)\);/
              );
              if (additionalDataMatch && additionalDataMatch.length >= 2) {
                jsonData = JSON.parse(additionalDataMatch[1]);
                logger.info('Found data in window.__additionalDataLoaded');
              }
            }

            if (!jsonData) {
              const webSharedDataMatch = scriptContent.match(
                /__d\("InstagramWebSharedData",[^{]+({.+})\);/
              );
              if (webSharedDataMatch && webSharedDataMatch.length >= 2) {
                try {
                  jsonData = JSON.parse(webSharedDataMatch[1]);
                  logger.info('Found data in InstagramWebSharedData');
                } catch (e) {
                  logger.warn(
                    `Failed to parse InstagramWebSharedData: ${e instanceof Error ? e.message : 'Unknown error'}`
                  );
                }
              }
            }

            if (jsonData) {
              try {
                let user = null;
                let edges = null;

                if (jsonData.entry_data?.ProfilePage?.[0]?.graphql?.user) {
                  user = jsonData.entry_data.ProfilePage[0].graphql.user;
                  edges = user.edge_owner_to_timeline_media?.edges;
                }

                if (!edges && jsonData.user) {
                  user = jsonData.user;
                  edges = user.edge_owner_to_timeline_media?.edges;
                }

                if (!edges && jsonData.data?.user) {
                  user = jsonData.data.user;
                  edges = user.edge_owner_to_timeline_media?.edges;
                }

                if (edges && edges.length > 0) {
                  const latestPost = edges[0].node;

                  const post: InstagramPost = {
                    id: latestPost.id,
                    caption:
                      latestPost.edge_media_to_caption?.edges?.[0]?.node?.text || 'No caption',
                    imageUrl: latestPost.display_url,
                    timestamp: new Date(latestPost.taken_at_timestamp * 1000).toISOString(),
                    likes: latestPost.edge_liked_by?.count,
                    postUrl: `https://www.instagram.com/p/${latestPost.shortcode}/`,
                  };

                  logger.info(`Successfully extracted post data from script tag ${i + 1}`);
                  return { success: true, data: post };
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger.warn(
                  `Failed to extract post data from script tag ${i + 1}: ${errorMessage}`
                );
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.warn(`Failed to process script tag ${i + 1}: ${errorMessage}`);
          }
        }
      }

      logger.info('Trying direct HTML parsing as fallback');

      try {
        const postLinks = $('a[href*="/p/"]')
          .map((_, el) => $(el).attr('href'))
          .get();

        if (postLinks.length > 0) {
          const firstPostLink = postLinks[0];
          const postUrl = firstPostLink.startsWith('http')
            ? firstPostLink
            : `https://www.instagram.com${firstPostLink}`;

          const imageUrl = $('img[src*="instagram"]').first().attr('src');

          if (imageUrl) {
            const post: InstagramPost = {
              caption: 'Caption not available via direct HTML parsing',
              imageUrl,
              postUrl,
            };

            logger.info('Successfully extracted basic post data via direct HTML parsing');
            return { success: true, data: post };
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.warn(`Direct HTML parsing failed: ${errorMessage}`);
      }

      throw new Error('Could not extract Instagram post data using any available method');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching Instagram data via Cheerio: ${errorMessage}`);
      return {
        success: false,
        error: `Cheerio error: ${errorMessage}`,
      };
    }
  }

  /**
   * Fetches the latest Instagram post using all available methods
   * Prioritizes web scraping methods over API when API access is unavailable
   * @returns Promise with Instagram response
   */
  public async getLatestPost(): Promise<InstagramResponse> {
    logger.info(`Fetching latest post for Instagram user: ${this.config.username}`);

    logger.info('Trying Puppeteer method first for web scraping');
    const puppeteerResult = await this.fetchViaPuppeteer();
    if (puppeteerResult.success) {
      return puppeteerResult;
    }

    logger.info('Puppeteer method failed, trying Cheerio method');
    const cheerioResult = await this.fetchViaCheerio();
    if (cheerioResult.success) {
      return cheerioResult;
    }

    if (this.config.accessToken) {
      logger.info('Web scraping methods failed, trying official API as last resort');
      const apiResult = await this.fetchViaApi();
      if (apiResult.success) {
        return apiResult;
      }
    }

    logger.error('All methods failed to fetch Instagram data');
    return {
      success: false,
      error: 'Failed to fetch Instagram data using all available methods',
    };
  }
}

export default InstagramService;
