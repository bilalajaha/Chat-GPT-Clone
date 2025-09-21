import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorNotification from '@/components/ErrorNotification';
import LoadingOverlay from '@/components/LoadingOverlay';
import { NetworkStatus } from '@/components/NetworkStatus';
import { ChatProvider } from '@/context/ChatContext';
import ThemeProvider from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChatGPT Clone',
  description: 'A modern ChatGPT clone built with Next.js and TypeScript',
  keywords: ['chatgpt', 'ai', 'chat', 'gemini', 'nextjs'],
  authors: [{ name: 'Your Name' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ChatProvider>
            <ThemeProvider>
              <div id="root">
                {children}
              </div>
              <NetworkStatus />
            </ThemeProvider>
          </ChatProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
