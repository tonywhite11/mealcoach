import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MealCoach AI',
  description: 'Personal AI meal planner, recipe library, and grocery list builder.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
