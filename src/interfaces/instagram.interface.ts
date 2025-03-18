export interface InstagramPost {
  id?: string;
  caption: string;
  imageUrl: string;
  timestamp?: string;
  likes?: number;
  postUrl?: string;
}


export interface InstagramConfig {
  username: string;
  accessToken?: string;
}

export interface InstagramResponse {
  success: boolean;
  data?: InstagramPost;
  error?: string;
}