import { GoogleGenAI, FunctionDeclaration, Type, Tool } from '@google/genai';
import { performCalculation } from './statistics';
import { CalculationParams, CalculationDetails, StudyType } from '../types';

// Define the tool schema
const calculateSampleSizeTool: FunctionDeclaration = {
  name: 'calculateSampleSize',
  description: 'Calculates the required sample size for a medical study based on study design and statistical parameters.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: ['one_mean', 'one_prop', 'two_means', 'two_props'],
        description: 'The type of statistical study design.',
      },
      alpha: {
        type: Type.NUMBER,
        description: 'Significance level (Type I error rate). Default is 0.05.',
      },
      power: {
        type: Type.NUMBER,
        description: 'Statistical power (1 - Beta). Default is 0.80.',
      },
      // For Two Means
      meanDiff: {
        type: Type.NUMBER,
        description: 'Expected difference between the two means (Effect Size). Required for two_means.',
      },
      stdDev: {
        type: Type.NUMBER,
        description: 'Standard deviation of the population (assumed equal for two groups). Required for means.',
      },
      // For Two Props
      p1: {
        type: Type.NUMBER,
        description: 'Expected proportion in group 1 (0 to 1). Required for two_props.',
      },
      p2: {
        type: Type.NUMBER,
        description: 'Expected proportion in group 2 (0 to 1). Required for two_props.',
      },
      // For Estimation
      marginError: {
        type: Type.NUMBER,
        description: 'Desired margin of error (precision). Required for one_mean or one_prop.',
      },
      p_expected: {
        type: Type.NUMBER,
        description: 'Expected proportion for single proportion estimation.',
      },
    },
    required: ['type'],
  },
};

export interface ChatResponse {
  text: string;
  calculation?: CalculationDetails;
}

export class GeminiService {
  private ai: GoogleGenAI;
  private modelName = 'gemini-2.5-flash';
  private history: any[] = [];

  constructor() {
    if (!process.env.API_KEY) {
      console.error("API_KEY is missing from environment variables");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async sendMessage(userMessage: string): Promise<ChatResponse> {
    try {
      const tools: Tool[] = [{ functionDeclarations: [calculateSampleSizeTool] }];
      
      // Construct history for the stateless generateContent call (or use Chat if persistent)
      // We will use a Chat session style approach but manually managed for flexibility with tools in this demo context
      const chat = this.ai.chats.create({
        model: this.modelName,
        config: {
          systemInstruction: `You are an expert Biostatistician assistant named "BioStat AI". 
          Your goal is to help medical researchers calculate sample sizes.
          
          1.  **Understand the Goal**: Determine if they are comparing means (continuous data), comparing proportions (categorical/binary data), or estimating a single parameter.
          2.  **Gather Parameters**: You CANNOT calculate without specific numbers. 
              - For Two Proportions: Ask for p1 (Group A rate) and p2 (Group B rate).
              - For Two Means: Ask for the expected Mean Difference and the Standard Deviation.
              - Always check for Alpha (assume 0.05) and Power (assume 0.80) but confirm if unsure.
          3.  **Validate**: If parameters are missing, explain what is needed clearly.
          4.  **Execute**: When you have the numbers, call the 'calculateSampleSize' tool.
          5.  **Explain**: After the tool result comes back, explain the result in the context of their study.
          
          Do not hallucinate the math. Rely on the tool.`,
          temperature: 0.2, // Low temperature for consistent math handling
          tools: tools,
        },
        history: this.history
      });

      // 1. Send user message
      let response = await chat.sendMessage({ message: userMessage });
      
      let calculationResult: CalculationDetails | undefined;
      
      // 2. Check for function calls
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0]; // Assume single call for this simple app
        
        if (call.name === 'calculateSampleSize') {
          console.log("Tool Call Args:", call.args);
          
          try {
            // Execute the local TS function
            const params = call.args as unknown as CalculationParams;
            calculationResult = performCalculation(params);
            
            // 3. Send result back to Gemini
            // The SDK expects the result to be sent back to continue the conversation
             const toolResponse = {
              functionResponses: [{
                id: call.id,
                name: call.name,
                response: { result: calculationResult }
              }]
            };

            response = await chat.sendMessage(toolResponse);
          
          } catch (error: any) {
            // Handle calculation error (e.g., division by zero)
            const errorResponse = {
                functionResponses: [{
                  id: call.id,
                  name: call.name,
                  response: { error: error.message }
                }]
            };
             response = await chat.sendMessage(errorResponse);
          }
        }
      }

      // Update local history tracking (optional if we were re-creating chat every time, but here we use the chat object)
      // We don't strictly need to sync 'this.history' manually because 'chat' instance maintains it,
      // but if we wanted to persist across page reloads we would extract it.
      
      return {
        text: response.text || "Calculation complete.",
        calculation: calculationResult
      };

    } catch (error) {
      console.error("Gemini Error:", error);
      return { text: "I encountered an error connecting to the AI service. Please try again." };
    }
  }
}

export const geminiService = new GeminiService();