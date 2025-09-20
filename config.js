// Configuration file for the ChatGPT Clone application
module.exports = {
  // Gemini API Configuration
  GEMINI_API_KEY: 'AIzaSyDJC2uo1TlyT-icghKX863to7XVBvSQScs',
  
  // Optional: Set to 'development' for debug mode
  NODE_ENV: 'development',
  
  // Available models
  DEFAULT_MODEL: 'gemini-pro',
  AVAILABLE_MODELS: [
    'gemini-pro',
    'gemini-pro-vision', 
    'gemini-1.5-pro',
    'gemini-1.5-flash'
  ]
};
