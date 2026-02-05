import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Global Fit Admin',
  description: 'Panel de Administracion - Global Fit',
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.className}>
      <body className="bg-gray-50 dark:bg-dark-950 text-gray-900 dark:text-gray-100 transition-colors duration-200 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
