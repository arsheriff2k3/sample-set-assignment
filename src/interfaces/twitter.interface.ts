export interface TweetRequest {
  instagramCaption: string;
}

export interface MediaTweetRequest extends TweetRequest {
  imageUrl: string;
}

export interface TweetResponse {
  success: boolean;
  message: string;
  data?: {
    tweetId?: string;
    tweetText: string;
  };
  error?: string;
}
