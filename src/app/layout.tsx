import type {Metadata} from 'next';
import './globals.css';
import { Sora } from 'next/font/google';
import Footer from '@/components/footer';

const sora = Sora({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'PhabFast',
  description: 'Quickly find development tasks from Phabricator.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sora.variable}>
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
