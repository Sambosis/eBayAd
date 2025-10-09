import { GoogleGenAI, Modality, Type } from "@google/genai";

const PROMPT_TEMPLATE = (description: string, style: string) => `
Task: You are a professional advertising designer. Your task is to create a stunning and effective advertisement image for an e-commerce platform using the provided product photo.

Style Guide:
- Adhere strictly to the following style: ${style}

Product Information:
${description}

Core Directives:
1.  **Product Prominence:** The product from the user's image MUST be the hero. It should be large, centrally located, and occupy a significant portion of the frame (at least 60-70%). The image should be a close-up or medium shot that showcases the product's form and texture.
2.  **Feature Callouts:** Analyze the 'Product Information' to identify 2-3 key features. Create visually integrated callouts (using lines, pointers, or stylized text labels) that point directly to these features on the product. These callouts should be brief, impactful, and designed to fit the overall ad style.
3.  **Dynamic Composition:** Create a visually engaging composition. The background and any added elements must complement the product and the specified style, without overpowering the product itself. The background should contrast with the product's main color to ensure it stands out.
4.  **Readability:** Ensure any text (feature callouts, headlines, etc.) is clearly readable, well-placed, and grammatically correct.

Critical Constraints:
- CRITICAL: Do NOT include any of the original retail packaging from the user's photo.
- CRITICAL: Do NOT add any marketplace logos (e.g., eBay, Amazon).
- CRITICAL: The final image must be clean, high-resolution, and professional.
`;

const INFO_FROM_IMAGE_PROMPT = `
You are an expert product identifier and copywriter.
Based on the user-uploaded image, your task is to:
1.  **Identify the Product:** Accurately determine the product's brand, model, and official name. If it's a generic item, provide a clear, descriptive name.
2.  **Generate a Product Description:** Write a detailed, well-structured, and persuasive product description as an HTML string, suitable for online marketplace listings.
    - Use Google Search to find all relevant information about the identified product.
    - The description must include:
        - A catchy title.
        - An introduction summarizing the product's main benefit.
        - A bulleted list of key features and specifications.
        - A list of what's typically included in the box.
        - A brief mention of the target audience.
    - **Formatting Rules:**
        - The entire description must be a single, well-formed HTML string.
        - Use <p> tags for paragraphs.
        - Use <h3> tags for headings (e.g., "<h3>Key Features:</h3>").
        - Use <ul> and <li> tags for bulleted lists.
        - Use <strong> tags for bold/emphasized text where appropriate.
        - Keep the language professional but easy to understand.
        - Do not include pricing information.
        - Do not reference any specific marketplace platform (like eBay, Amazon, Etsy, etc.).
        - Base the description strictly on search results.

**Output Format:**
Return a single, valid JSON object with two keys: "productName" and "productDescription".
- "productName": A string containing the official product name and model.
- "productDescription": A string containing the full, HTML-formatted description. The string must be properly escaped to be a valid JSON string value.
`;

const SUGGEST_STYLES_PROMPT = `
You are a world-class marketing and creative director. Your task is to generate exactly 3 distinct, innovative, and highly creative ad style concepts for the given product. Think outside the box and provide a diverse range of options, from commercially appealing to bold and artistic.

For each of the 3 concepts, provide:
1.  **name**: A short, catchy, and descriptive name for the style (e.g., 'Kinetic Energy', 'Serene Tech', 'Retro Blueprint').
2.  **description**: A brief, one-sentence description that powerfully evokes the style's look and feel.
3.  **prompt**: A detailed, expert-level prompt for an image generation AI. This prompt is the most critical part. It must be rich with descriptive keywords and instructions to guide the creation of a complete advertisement image. It should specify:
    - **Overall Mood & Vibe:** (e.g., energetic, luxurious, futuristic, organic)
    - **Color Palette:** (e.g., neon-drenched jewel tones, muted earthy tones, high-contrast monochrome with a single accent color)
    - **Lighting:** (e.g., dramatic studio lighting with hard shadows, soft and ethereal natural light, neon glow)
    - **Background & Environment:** (e.g., an abstract geometric landscape, a hyper-realistic macro environment, a deconstructed product schematic)
    - **Typography Style:** (e.g., bold sans-serif with glitch effects, elegant serif, handwritten script)
    - **Compositional Notes:** (e.g., dynamic angles, rule of thirds, symmetrical)

Analyze the product's function and target audience to brainstorm styles that are not just relevant but also surprising and memorable. Ensure the three styles are fundamentally different from each other.
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
            // The description is now HTML, so we don't need to process newlines.
            return {
                productName: parsed.productName,
                productDescription: parsed.productDescription,
            };
        } else {
             throw new Error("Invalid JSON structure in AI response.");
        }
    } catch (e) {
        console.error("Failed to parse JSON response:", response.text);
        throw new Error("The AI returned an invalid response. Please try again.");
    }
}


export const generateAdImage = async (
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
    console.log("Ad Image Generation Prompt:", prompt);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
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