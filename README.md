# AdSpark AI

![AdSpark AI](https://img.shields.io/badge/AI-Powered-indigo?style=flat-square) ![React](https://img.shields.io/badge/React-19.1.1-blue?style=flat-square) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue?style=flat-square) ![Vite](https://img.shields.io/badge/Vite-6.2.0-purple?style=flat-square)

An AI-powered eBay advertisement generator that transforms product images into compelling, professionally-designed ad graphics using Google's Gemini AI.

## Features

### 🤖 AI-Powered Product Recognition
- Upload or capture product images directly from your camera
- Automatic product identification and detailed description generation
- Google Search integration for accurate product specifications

### 🎨 Multiple Ad Styles
Six pre-built design themes:
- **Modern & Minimalist** - Clean lines and professional aesthetics
- **Tech & Dynamic** - Energetic designs with neon accents
- **Elegant & Professional** - Luxurious and sophisticated layouts
- **Lifestyle & Aspirational** - Real-world context showcasing
- **Vintage & Nostalgic** - Retro-inspired designs
- **Retro Futurism** - Blend of vintage and futuristic elements

### ✨ AI Style Suggestions
- Get custom style recommendations based on your specific product
- Tailored design concepts optimized for your target audience

### 📸 Flexible Image Input
- Upload images from your device
- Capture photos directly using your device camera
- Automatic fallback to file upload if camera is unavailable

### 💾 Session History
- Save and reload previous product sessions
- Access all generated ads from past sessions
- Export and download generated advertisements

### 🎯 User-Friendly Interface
- Clean, modern dark-themed UI
- Responsive design for desktop and mobile
- Real-time ad generation and preview
- Editable product names and descriptions

## Technology Stack

### Frontend
- **React 19.1.1** - UI framework
- **TypeScript 5.8.2** - Type-safe development
- **Vite 6.2.0** - Fast build tool and dev server
- **Tailwind CSS** (via CDN) - Utility-first styling
- **Inter Font** - Modern typography

### AI & Services
- **Google Gemini AI** - Product recognition and ad generation
  - `gemini-2.5-flash` - Product identification with Google Search
  - `gemini-2.5-flash-image-preview` - Advertisement image generation
- **@google/genai 1.20.0** - Official Google GenAI SDK

### Additional Libraries
- **jszip 3.10.1** - Archive handling

## Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- A Google Gemini API key ([Get one here](https://ai.google.dev/))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Sambosis/ebayad.git
cd ebayad
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

### Basic Workflow

1. **Upload Product Image**
   - Click the upload area or use the camera button
   - Select or capture an image of your product
   - AI will automatically identify the product and generate a description

2. **Review & Edit**
   - Review the auto-generated product name and description
   - Edit any details as needed

3. **Generate Ads**
   - Choose from 6 pre-built styles or click "Suggest Styles" for custom recommendations
   - Click "Generate" on any style to create an ad
   - Preview generated ads in full-screen mode

4. **Save & Export**
   - Save your session to history for later access
   - Download individual ad images
   - Start over to create ads for a new product

## Project Structure

```
ebayad/
├── components/           # React components
│   ├── AdPreviewModal.tsx
│   ├── GeneratedAd.tsx
│   ├── HistoryPanel.tsx
│   └── ImageUploader.tsx
├── hooks/               # Custom React hooks
│   └── useLocalStorage.ts
├── services/            # External service integrations
│   └── geminiService.ts
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |

## API Integration

The application uses Google's Gemini AI with the following models:

- **gemini-2.5-flash**: Product identification with Google Search grounding
- **gemini-2.5-flash-image-preview**: Advertisement image generation with multimodal output

## Features in Detail

### Product Recognition
- Extracts product brand, model, and specifications
- Generates SEO-friendly product descriptions
- Uses Google Search for accurate, up-to-date information
- Formats descriptions in markdown

### Ad Generation
- Background removal and product isolation
- Custom layouts based on selected style
- Typography and color scheme matching
- Icon and visual element integration
- Professional composition and spacing

### Style Suggestions
- AI analyzes product type and target audience
- Generates 3-5 custom style concepts
- Provides detailed design prompts
- Seamlessly integrates with existing styles

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with ES6+ support

## Recent Updates

- ✅ Camera capture fallback improvements
- ✅ Photo upload from camera or file
- ✅ Enhanced camera stream handling
- ✅ Improved error handling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is available for use under standard open-source practices.

## Acknowledgments

- Powered by [Google Gemini AI](https://ai.google.dev/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Built with [Vite](https://vitejs.dev/) and [React](https://react.dev/)

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Made with ✨ by the AdSpark AI team**
