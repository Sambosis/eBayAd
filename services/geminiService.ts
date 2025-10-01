import { GoogleGenAI, Modality, Type } from "@google/genai";

const PROMPT_TEMPLATE = (description: string, style: string) => `
You are a professional graphic designer specializing in e-commerce product advertisements.
Your task is to create a compelling and visually appealing advertisement image for an eBay listing based on the provided product image, description, and requested style.

**Style:** ${style}

Product Description: "${description}"

**Instructions:**
1.  **Interpret the Style:** Strictly adhere to the requested "${style}" theme in your design.
2.  **Analyze the Product:** Use the provided image and Product Description to understand the product's appearance. Use the description to understand its features, specs, and target audience.
3.  **Professional Layout:** Create a layout that reflects the "${style}" theme. Use a balanced composition with a sophisticated color palette that complements the product and the style.
4.  **Highlight Key Information:** Extract the most important features, use cases, and specifications from the description. Present this information clearly using short text snippets and typography that match the "${style}" theme.
5.  **Incorporate Visuals & Icons:** Use relevant, beautifully designed, colored icons and visual elements that fit the "${style}" theme.
6.  **Product Image:** Isolate the main product from the provided image, removing its original background completely. Place the isolated product prominently in your new design, perhaps with a subtle drop shadow to make it stand out.
7.  **CRITICAL RULE:** Do NOT show any retail packaging, boxes, or original branding from a box. The focus must be solely on the product itself and its features.
8.  **Final Output:** The final image should be a single, cohesive advertisement graphic ready for an eBay listing. It should look polished and trustworthy.
`;

const INFO_FROM_IMAGE_PROMPT = `
You are an expert product identifier and copywriter.
Based on the user-uploaded image, your task is to:
1.  **Identify the Product:** Accurately determine the product's brand, model, and official name. If it's a generic item, provide a clear, descriptive name.
2.  **Generate a Product Description:** Write a detailed, well-structured, and persuasive product description for an eBay listing.
    - Use Google Search to find all relevant information about the identified product.
    - The description must include:
        - A catchy title as the first line.
        - An introduction summarizing the product's main benefit.
        - A bulleted list of key features and specifications.
        - A statement that the condition is "Brand New".
        - A list of what's typically included in the box.
        - A brief mention of the target audience.
    - **Formatting Rules:**
        - Use clear headings with markdown (e.g., "**Key Features:**").
        - Use markdown bullet points (-).
        - Keep the language professional but easy to understand.
        - Do not include pricing information.
        - Base the description strictly on search results.

**Output Format:**
Return a single, valid JSON object with two keys: "productName" and "productDescription".
- "productName": A string containing the official product name and model.
- "productDescription": A string containing the full, markdown-formatted description. CRITICAL: All newline characters inside this string MUST be escaped as \\\\n to ensure the final output is a valid JSON object.
`;

const SUGGEST_STYLES_PROMPT = `
You are a world-class marketing and branding expert. Based on the provided product image and description, your task is to generate 3 to 5 innovative and relevant ad style concepts suitable for an eBay listing.

For each concept, provide:
1.  **name**: A short, catchy name for the style (e.g., 'Urban Explorer', 'Eco-Minimalist').
2.  **description**: A brief, one-sentence description of the style's look and feel.
3.  **prompt**: A detailed prompt for an image generation AI that captures the essence of the style. This prompt should be detailed enough to guide the creation of a complete advertisement image, describing aesthetics, color palettes, typography, layout, and overall mood. It should be similar in structure to prompts like: "Modern & Spec Driven: A sleek, contemporary aesthetic featuring clean lines, ample white space, and a minimalist design...".

Analyze the product to determine what styles would be most effective in attracting its target audience.
`;

const styleSuggestionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: {
                type: Type.STRING,
                description: "A short, catchy name for the style.",
            },
            description: {
                type: Type.STRING,
                description: "A brief, one-sentence description of the style's look and feel.",
            },
            prompt: {
                type: Type.STRING,
                description: "A detailed prompt for an image generation AI.",
            },
        },
        required: ["name", "description", "prompt"],
    },
};

export const generateProductInfoFromImage = async (
    imageBase64: string,
    mimeType: string
): Promise<{ productName: string; productDescription: string }> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType,
                    },
                },
                {
                    text: INFO_FROM_IMAGE_PROMPT,
                },
            ],
        },
        config: {
            tools: [{googleSearch: {}}],
        },
    });

    try {
        const textResponse = response.text;
        // The model can sometimes return the JSON wrapped in markdown or with other text.
        // We'll find the start and end of the JSON object to handle this.
        const startIndex = textResponse.indexOf('{');
        const endIndex = textResponse.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
            throw new Error("Could not find a valid JSON object in the AI's response.");
        }
        
        const jsonText = textResponse.substring(startIndex, endIndex + 1);

        const parsed = JSON.parse(jsonText);
        if (parsed.productName && parsed.productDescription) {
            return parsed;
        } else {
             throw new Error("Invalid JSON structure in AI response.");
        }
    } catch (e) {
        console.error("Failed to parse JSON response:", response.text);
        throw new Error("The AI returned an invalid response. Please try again.");
    }
}


export const generateEbayAdImage = async (
    description: string,
    imageBase64: string,
    mimeType: string,
    style: string
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = PROMPT_TEMPLATE(description, style);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType,
                    },
                },
                {
                    text: prompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
    }
    
    throw new Error('No image was generated by the AI. Please try again.');
};

export const generateAdStyleSuggestions = async (
    productDescription: string,
    imageBase64: string,
    mimeType: string
): Promise<{ name: string; description: string; prompt: string }[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const fullPrompt = `
Product Description: "${productDescription}"

${SUGGEST_STYLES_PROMPT}
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType,
                    },
                },
                { text: fullPrompt },
            ],
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: styleSuggestionSchema,
        },
    });

    try {
        const jsonText = response.text.trim();
        const suggestions = JSON.parse(jsonText);
        if (Array.isArray(suggestions)) {
            return suggestions;
        }
        throw new Error("AI response for style suggestions was not a valid array.");
    } catch (e) {
        console.error("Failed to parse style suggestions JSON response:", response.text);
        throw new Error("The AI returned an invalid response for style suggestions. Please try again.");
    }
};