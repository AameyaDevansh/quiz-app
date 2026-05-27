import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
// @ts-ignore -- Next.js handles global CSS imports in app layouts
import './globals.css';

export const metadata: Metadata = {
  title: 'QuizArena — Real-time Multiplayer Quiz',
  description: 'Compete live against friends in real-time quiz battles.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
