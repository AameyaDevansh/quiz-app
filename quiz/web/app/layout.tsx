import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '@/components/common/Navbar';
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
        <body>
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
