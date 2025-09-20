# ChatGPT Clone

A modern, responsive ChatGPT clone built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🤖 AI-powered conversations using OpenAI GPT
- 💬 Real-time chat interface with streaming responses
- 📱 Responsive design for mobile and desktop
- 🌙 Dark/Light theme support
- 💾 Local storage for chat history
- ⌨️ Keyboard shortcuts
- 🎨 Modern UI with smooth animations

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT API
- **State Management**: React Context API
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chat-gpt-clone
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
# Copy the example config
cp config.example.js config.js

# Edit config.js and add your OpenAI API key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

Edit `config.js` to configure:

- OpenAI API key
- Default model
- API endpoint
- Application settings

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # External library configurations
├── styles/             # Global styles
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- OpenAI for the GPT API
- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
