import { GoogleGenerativeAI } from '@google/generative-ai';
import { SummarizationRequest, SummarizationResponse } from '../interfaces/llm.interface';
import logger from '../utils/logger';

class LLMService {
  private gemini: GoogleGenerativeAI;
  private readonly DEFAULT_MAX_LENGTH = 280;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error('GEMINI_API_KEY is not defined in environment variables');
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.gemini = new GoogleGenerativeAI(apiKey);
    logger.info('LLM service initialized with Gemini model');
  }

  /**
   * Summarizes a text (Instagram caption) into a tweet-sized summary
   * @param request The summarization request containing the text to summarize
   * @returns A promise that resolves to the summarized text
   */
  async summarizeText(request: SummarizationRequest): Promise<SummarizationResponse> {
    const { text, maxLength = this.DEFAULT_MAX_LENGTH } = request;

    try {
      logger.info(`Summarizing text of length ${text.length} with max output length ${maxLength}`);

      const model = this.gemini.getGenerativeModel({
        model: 'gemini-2.0-flash',
      });
      logger.debug('Using gemini-2.0-flash model for summarization');

      const prompt = `Summarize this Instagram caption into a tweet (max ${maxLength} characters), keeping the message engaging:\n\n"${text}"`;

      logger.debug('Sending request to Gemini API');
      const result = await model.generateContent(prompt);
      const response = result.response;
      const summary = response.text().trim();

      const finalSummary = summary.substring(0, maxLength);
      logger.info(`Successfully summarized text to ${finalSummary.length} characters`);

      return { summary: finalSummary };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error summarizing text with LLM: ${errorMessage}`);
      throw new Error(`Failed to summarize text: ${errorMessage}`);
    }
  }
}

export const llmService = new LLMService();
