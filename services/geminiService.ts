import { GoogleGenAI, Modality } from "@google/genai";

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

const DESCRIPTION_PROMPT_TEMPLATE = (productName: string) => `
You are an expert eBay seller with years of experience in writing compelling product descriptions that sell.
Your task is to generate a detailed, well-structured, and persuasive product description for an eBay listing.

Use Google Search to find all relevant information about the following product: "${productName}".

Based on your search results, create a description that includes:
1.  **Catchy Title:** A brief, attention-grabbing title as the first line.
2.  **Introduction:** A short paragraph summarizing the product and its main benefit.
3.  **Key Features:** A bulleted list of the most important features and specifications.
4.  **Condition:** Assume the product is "Brand New" and state this clearly.
5.  **What's Included:** List what a buyer would typically receive in the box.
6.  **Target Audience:** Briefly mention who this product is perfect for (e.g., "Ideal for students, professionals, and frequent travelers.").

**Formatting Rules:**
- Use clear headings with markdown for each section (e.g., "**Key Features:**").
- Use markdown bullet points (-) for lists.
- Keep the language professional but easy to understand.
- Do not include pricing information.
- Do not make up information. Base the description strictly on the search results.

Generate only the text for the description, starting with the title.
`;


export const generateEbayDescription = async (productName: string): Promise<string> => {
     if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = DESCRIPTION_PROMPT_TEMPLATE(productName);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        },
    });

    return response.text;
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
