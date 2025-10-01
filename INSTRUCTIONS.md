# AdSpark AI - Instructions

## What is AdSpark AI?

AdSpark AI is an intelligent product advertisement generator that uses AI to create professional, eye-catching ads for online marketplaces. Simply upload a product image, and the AI will automatically identify your product, generate a compelling description, and create stunning advertisement images in multiple visual styles.

## Key Features

### 🎨 **AI-Powered Ad Generation**
- Upload any product image and get professionally designed ads in seconds
- Choose from 8 pre-built visual styles or get AI-generated style suggestions
- Each ad is optimized for online marketplace listings (eBay, Amazon, Etsy, etc.)

### 🤖 **Automatic Product Identification**
- AI automatically identifies your product's brand, model, and specifications
- Generates professional product descriptions with key features
- Uses Google Search to find accurate product information

### 💾 **Session History**
- Save your work to review later
- Load previous sessions to generate more ad variations
- Export all generated ads as a ZIP file

### ⌨️ **Keyboard Shortcuts**
- Press **G** to generate all ad styles at once
- Press **S** to save your session to history

## How to Use

### Step 1: Upload Product Image
1. Click the upload area or drag & drop a product image
2. The AI will automatically analyze the image and identify the product
3. Wait for the AI to generate a product name and description

### Step 2: Review & Edit Product Information
1. Review the auto-generated product name and description
2. Edit the text if needed to add specific details or corrections
3. Click "Regenerate" if you want the AI to create a new description

### Step 3: Generate Ad Styles
1. **Single Ad Generation:**
   - Click "Generate" on any style card to create one ad
   - Preview the ad by clicking on it

2. **Bulk Generation:**
   - Click "Generate All" to create ads in every available style
   - Each ad typically takes 15-30 seconds to generate

3. **AI Style Suggestions:**
   - Click "Suggest Styles" to get 3-5 AI-recommended styles based on your product
   - The AI analyzes your product to suggest the most effective visual styles

### Step 4: Download Your Ads
- **Single Download:** Click the download icon on any generated ad
- **Bulk Download:** Click "Download All" to get a ZIP file with all ads

### Step 5: Save Your Session
1. Click "Save to History" to save your current session
2. Access saved sessions by clicking "History" in the top-right corner
3. Load any previous session to continue working or generate more variations

## Available Ad Styles

### **Modern & Minimalist**
Clean, professional design with bold typography and striking color contrasts. Perfect for tech products and professional equipment.

### **Tech & Cyberpunk**
Futuristic neon-lit design with dark backgrounds and glowing effects. Ideal for gaming gear, tech gadgets, and electronics.

### **Premium Luxury**
Sophisticated design with gold accents and elegant fonts. Best for high-end products, jewelry, and luxury items.

### **Bold & Energetic**
Eye-catching design with vibrant colors and dynamic angles. Great for sports equipment, youth products, and action items.

### **Natural & Organic**
Earthy, eco-friendly design with natural textures. Perfect for sustainable products, organic goods, and wellness items.

### **Vintage Retro**
Nostalgic design with retro color schemes and aged textures. Ideal for collectibles, vintage items, and classic products.

### **Info-Graphic Style**
Data-driven design with charts and comparison visuals. Best for technical products needing detailed specifications.

### **E-Sports & Gaming**
High-energy gaming aesthetic with RGB effects. Perfect for gaming peripherals, streaming equipment, and esports gear.

## Tips for Best Results

### **Image Quality**
- Use clear, well-lit product photos
- Avoid blurry or low-resolution images
- Plain backgrounds work best (the AI removes backgrounds automatically)
- Show the product from a clear angle

### **Product Descriptions**
- Keep descriptions detailed but concise
- Include key features and specifications
- Mention the target audience or use cases
- Avoid overly promotional language

### **Style Selection**
- Choose styles that match your product category
- Gaming products → E-Sports & Gaming or Tech & Cyberpunk
- Luxury items → Premium Luxury or Elegant & Professional
- Eco products → Natural & Organic
- Electronics → Modern & Minimalist or Info-Graphic Style

### **Optimization**
- Generate multiple styles to see what works best
- Save successful sessions for future reference
- Use the tutorial (? icon) if you need a refresher

## Technical Requirements

### **Setup**
1. Ensure you have Node.js installed
2. Install dependencies: `npm install`
3. Create a `.env` file with your Google AI API key:
   ```
   API_KEY=your_google_ai_api_key_here
   ```
4. Run the development server: `npm run dev`

### **API Key Setup**
- Get your Google AI API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- The app uses Gemini 2.5 Flash for analysis and Gemini 2.5 Flash Image Preview for image generation
- Keep your API key secure and never commit it to version control

## Troubleshooting

### **AI not identifying products correctly:**
- Try a different image with better lighting
- Use the "Regenerate" button to get a new description
- Manually edit the description with correct information

### **Ads not generating:**
- Check your internet connection
- Verify your API key is valid
- Try generating one style at a time instead of all at once

### **Images appearing with platform branding:**
- The AI has been instructed to avoid platform logos
- Try regenerating if you see unwanted branding
- Edit the product description to be more generic

### **Tutorial overlay covering content:**
- Click "Skip Tour" to exit the tutorial
- Click outside the tutorial tooltip to dismiss it
- Access the tutorial again via the ? icon in the header

## Keyboard Shortcuts Reference

| Key | Action |
|-----|--------|
| `G` | Generate all ad styles |
| `S` | Save current session to history |

## Privacy & Data

- All processing happens through Google AI APIs
- Product images are sent to Google for AI analysis
- No data is stored on external servers beyond your browser's local storage
- Session history is saved locally in your browser
- Clear your browser data to remove saved sessions

## Support

For issues, feature requests, or questions:
- Check the tutorial (? icon in header)
- Review this documentation
- Contact the development team

---

**Version:** 1.0
**Last Updated:** 2025-10-01
