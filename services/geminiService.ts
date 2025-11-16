import { GoogleGenAI, Chat, Modality } from "@google/genai";

const apiKey = process.env.API_KEY;

if (!apiKey) {
    console.warn("API Key not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: apiKey! });

export const initializeChat = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are 'Bonus', an AI concierge for the 'Bona Parks' virtual experience platform. Your expertise is in helping guests discover events, navigate the platform, and answer questions about our experiences. Your tone is friendly, helpful, and knowledgeable. Do not refer to yourself as an AI model.",
        },
    });
};

export const sendMessageStream = async (chat: Chat, message: string) => {
    return await chat.sendMessageStream({ message });
};

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export const generateImage = async (prompt: string, aspectRatio: AspectRatio = '1:1'): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const image = response.generatedImages[0];
            return `data:${image.image.mimeType};base64,${image.image.imageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Gemini image generation error:", error);
        throw new Error("Failed to generate image from the API.");
    }
};

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType
    },
  };
};

export const editImage = async (prompt: string, baseImage: string, logoImage?: string): Promise<string> => {
    try {
        const baseImageMimeType = baseImage.match(/data:(.*);base64,/)?.[1];
        if (!baseImageMimeType) {
            throw new Error("Invalid base image format");
        }

        const imageParts = [fileToGenerativePart(baseImage, baseImageMimeType)];

        if (logoImage) {
            const logoImageMimeType = logoImage.match(/data:(.*);base64,/)?.[1];
            if (logoImageMimeType) {
                imageParts.push(fileToGenerativePart(logoImage, logoImageMimeType));
            } else {
                 console.warn("Invalid logo image format; proceeding without it.");
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    ...imageParts,
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image was returned from the edit.");

    } catch (error) {
        console.error("Gemini image editing error:", error);
        throw new Error("Failed to edit image using the API.");
    }
};

export const generateVideo = async (prompt: string, aspectRatio: AspectRatio = '16:9'): Promise<any> => {
    try {
        const operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                aspectRatio: aspectRatio,
            }
        });
        return operation;
    } catch (error) {
        console.error("Gemini video generation error:", error);
        throw new Error("Failed to start video generation from the API.");
    }
};

export const checkVideoStatus = async (operation: any): Promise<any> => {
    try {
        const status = await ai.operations.getVideosOperation({ operation: operation });
        return status;
    } catch (error) {
        console.error("Gemini video status check error:", error);
        throw new Error("Failed to check video status from the API.");
    }
};

export const editVideo = async (prompt: string, videoUrl: string, options: { musicTrack?: string, editRegion?: string } = {}): Promise<string> => {
    console.warn("Video editing is currently a simulated feature as the underlying API does not support video-to-video editing. This function will return the original video after a delay.");
    
    console.log("--- SIMULATED VIDEO EDIT REQUEST ---");
    console.log("Visual Prompt:", prompt);
    console.log("Music Track:", options.musicTrack || "Not specified");
    console.log("Edit Region:", options.editRegion || "Not specified");
    console.log("------------------------------------");

    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // In a future implementation, an API call to a video editing model would go here.
    // For now, we return the original video URL.
    return videoUrl;
};
