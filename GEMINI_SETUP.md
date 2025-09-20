# Gemini API Setup Guide

This guide will help you set up the Gemini API for the ChatGPT Clone application.

## Prerequisites

1. A Google Cloud account
2. Access to the Google AI Studio or Google Cloud Console

## Getting Your Gemini API Key

### Method 1: Google AI Studio (Recommended)

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click on "Get API Key" in the left sidebar
4. Click "Create API Key" 
5. Choose "Create API key in new project" or select an existing project
6. Copy the generated API key

### Method 2: Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Generative AI API
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" > "API Key"
6. Copy the generated API key

## Setting Up the Environment

1. Copy the example configuration file:
   ```bash
   cp config.example.js config.js
   ```

2. Edit `config.js` and add your API key:
   ```javascript
   module.exports = {
     GEMINI_API_KEY: 'your_actual_api_key_here',
     // ... other config
   };
   ```

3. Create a `.env.local` file in the root directory:
   ```bash
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## Available Models

The application supports the following Gemini models:

- `gemini-pro` - General purpose model (default)
- `gemini-pro-vision` - Model with vision capabilities
- `gemini-1.5-pro` - Latest and most capable model
- `gemini-1.5-flash` - Faster, lighter model

## Testing the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and go to `http://localhost:3000`

3. Try sending a message to test the API integration

## Troubleshooting

### Common Issues

1. **"Gemini API key is not configured" error**
   - Make sure you've set the `GEMINI_API_KEY` environment variable
   - Check that the API key is valid and active

2. **"Failed to get response from AI" error**
   - Verify your API key has the correct permissions
   - Check your internet connection
   - Ensure you haven't exceeded API quotas

3. **CORS errors**
   - The API calls are made from the server-side, so CORS shouldn't be an issue
   - If you see CORS errors, check your Next.js configuration

### API Quotas and Limits

- Free tier: 15 requests per minute
- Paid tier: Higher limits available
- Check your usage in the Google AI Studio dashboard

## Security Notes

- Never commit your API key to version control
- Use environment variables for production deployments
- Consider using API key rotation for enhanced security

## Support

If you encounter issues:

1. Check the [Gemini API documentation](https://ai.google.dev/docs)
2. Verify your API key permissions
3. Check the browser console for detailed error messages
4. Ensure your project has the Generative AI API enabled
