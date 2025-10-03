import { GoogleGenAI, Modality, Type } from "@google/genai";

const PROMPT_TEMPLATE = (description: string, style: string) => `
You are a world-class graphic designer and visual marketing expert specializing in high-converting e-commerce product advertisements.
Your task is to create a compelling, professional-grade advertisement image for online marketplace listings.

**Style Theme:** ${style}

**Product Description:** "${description}"

**DESIGN REQUIREMENTS:**

1.  **Visual Hierarchy & Composition:**
    - Use the rule of thirds for balanced composition
    - Create clear focal points that guide the eye naturally
    - Ensure the product is the hero element (40-50% of the space)
    - Use negative space strategically to avoid clutter

2.  **Product Presentation:**
    - Isolate the product from the original image with perfect edge detection
    - Remove ALL backgrounds completely - extract just the product
    - Add professional lighting effects: subtle shadows, highlights, and depth
    - Position the product at a dynamic angle if appropriate for the style
    - Apply a soft drop shadow or reflection for dimensionality

3.  **Typography & Text Hierarchy:**
    - Product name: Large, bold, attention-grabbing (matches style theme)
    - Key features: Medium size, scannable bullet points or callouts
    - Specifications: Smaller, organized, easy to read
    - Use maximum 2-3 font families
    - Ensure high contrast for readability (text vs background)

4.  **Color Psychology:**
    - Choose colors that match both the style theme AND product category
    - Use complementary colors for visual interest
    - **Background Contrast:** To ensure the product stands out, select a background that contrasts with the product's main color. For dark-colored products, prefer a light background. For light-colored products, prefer a dark background. This contrast is crucial for visual impact.
    - Maintain 60-30-10 color ratio (dominant-secondary-accent)
    - Ensure brand/product colors are honored if applicable

5.  **Visual Elements & Icons:**
    - Use modern, minimalist icons for features (battery life, speed, size, etc.)
    - Ensure icons are consistent in style and weight
    - Add subtle geometric shapes or patterns that enhance the style
    - Include trust indicators when appropriate (warranty, quality badges)

6.  **Information Display:**
    - Highlight 3-5 KEY selling points maximum
    - Use visual callouts with arrows or lines to point to features
    - Create information boxes or cards for technical specs
    - Use icons + text combinations for quick comprehension

7.  **Professional Polish:**
    - Add subtle gradients or textures that match the style
    - Ensure all elements are perfectly aligned (use grids)
    - Apply consistent spacing and padding
    - Create depth with layering and shadows

**CRITICAL RULES:**
- NO retail packaging or boxes
- NO platform-specific logos (eBay, Amazon, Etsy, etc.)
- NO cluttered layouts - maintain clean, professional aesthetics
- Text must be LARGE enough to read on mobile devices
- Background MUST contrast with the product's main color. For dark-colored products, use a light background. For light-colored products, use a dark background.

- All Text MUST be properly spelled and WITHOUT typos. 

**OUTPUT:** A single, print-ready advertisement image at high resolution that stops scrollers and drives conversions.
`;

const INFO_FROM_IMAGE_PROMPT = `
You are an expert product identifier and copywriter.
Based on the user-uploaded image, your task is to:
1.  **Identify the Product:** Accurately determine the product's brand, model, and official name. If it's a generic item, provide a clear, descriptive name.
2.  **Generate a Product Description:** Write a detailed, well-structured, and persuasive product description for online marketplace listings.
    - Use Google Search to find all relevant information about the identified product.
    - The description must include:
        - A catchy title as the first line.
        - An introduction summarizing the product's main benefit.
        - A bulleted list of key features and specifications.
        - A list of what's typically included in the box.
        - A brief mention of the target audience.
    - **Formatting Rules:**
        - Use clear headings with markdown (e.g., "**Key Features:**").
        - Use markdown bullet points (-).
        - Keep the language professional but easy to understand.
        - Do not include pricing information.
        - Do not reference any specific marketplace platform (like eBay, Amazon, Etsy, etc.).
        - Base the description strictly on search results.

**Output Format:**
Return a single, valid JSON object with two keys: "productName" and "productDescription".
- "productName": A string containing the official product name and model.
- "productDescription": A string containing the full, markdown-formatted description. CRITICAL: All newline characters inside this string MUST be escaped as \\\\n to ensure the final output is a valid JSON object.
`;

const SUGGEST_STYLES_PROMPT = `
You are a world-class marketing and branding expert. Based on the provided product image and description, your task is to generate 3 to 5 innovative and relevant ad style concepts suitable for online marketplace listings.

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
            // The model is instructed to escape newlines as \\n. JSON.parse turns that into a literal `\n` string.
            // We need to replace those literals with actual newline characters for rendering.
            const correctlyFormattedDescription = parsed.productDescription.replace(/\\n/g, '\n');

            return {
                productName: parsed.productName,
                productDescription: correctlyFormattedDescription,
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