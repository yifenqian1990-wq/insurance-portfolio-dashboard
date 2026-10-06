
import { GoogleGenAI, Type } from "@google/genai";
import { Policy, PolicyCategory } from "../types";
import { apiKeyManager } from "./apiKeyManager";

/**
 * Converts a File object to a Base64 string (without the data URL prefix).
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Analyzes an insurance policy document (PDF or Image) using Gemini 2.5 Flash as requested.
 */
export async function analyzePolicyDocument(file: File, retryCount = 0): Promise<Partial<Policy>> {
  const currentKey = apiKeyManager.getApiKey();
  
  try {
    const base64Data = await fileToBase64(file);
    const mimeType = file.type;
    
    const ai = new GoogleGenAI({ apiKey: currentKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Analyze this insurance policy document and extract the following information into a JSON object.
            
            Please ensure the 'category' field exactly matches one of these values:
            - '健康险' (Health Insurance)
            - '车险' (Vehicle Insurance)
            - '人寿/意外险' (Life/Accident Insurance)
            - '财产险' (Property Insurance)
            - '责任险' (Liability Insurance)

            If the document lists multiple insured persons (e.g. a family policy), list the main one in 'insuredPerson' and the rest in 'otherInsuredPersons'.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The name of the insurance product" },
            insurer: { type: Type.STRING, description: "The name of the insurance company" },
            policyNumber: { type: Type.STRING, description: "The unique policy number" },
            category: { 
              type: Type.STRING, 
              description: "The category of the insurance",
              enum: Object.values(PolicyCategory)
            },
            insuredPerson: { type: Type.STRING, description: "The name of the primary insured person" },
            otherInsuredPersons: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "Names of other insured persons." 
            },
            premium: { type: Type.NUMBER, description: "The annualized premium amount in CNY" },
            coverageAmount: { type: Type.NUMBER, description: "The total coverage amount in CNY" },
            startDate: { type: Type.STRING, description: "Policy start date YYYY-MM-DD" },
            endDate: { type: Type.STRING, description: "Policy end date YYYY-MM-DD" },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "Key features extracted" 
            }
          },
          required: ["name", "insurer", "category", "premium", "coverageAmount", "startDate", "endDate"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    const data = JSON.parse(response.text);
    
    const now = new Date();
    const endDate = new Date(data.endDate);
    const startDate = new Date(data.startDate);
    
    let status: 'Active' | 'Expired' | 'Pending' = 'Active';
    if (endDate < now) status = 'Expired';
    if (startDate > now) status = 'Pending';

    const premiumDisplay = `¥${data.premium.toLocaleString()} / 年`;
    const coverageDisplay = `¥${(data.coverageAmount / 10000).toFixed(0)}万`;

    return {
      ...data,
      premiumDisplay,
      coverageDisplay,
      status
    };

  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    
    // Check for quota exceeded error (429)
    if ((error?.message?.includes('429') || error?.status === 429) && retryCount < 5) {
      apiKeyManager.markAsDepleted(currentKey);
      console.log('Switching key and retrying analysis...');
      return analyzePolicyDocument(file, retryCount + 1);
    }
    
    throw error;
  }
}
