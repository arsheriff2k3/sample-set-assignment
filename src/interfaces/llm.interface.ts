export interface SummarizationRequest {
  text: string;
  maxLength?: number;
}

export interface SummarizationResponse {
  summary: string;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  error: string;
}
