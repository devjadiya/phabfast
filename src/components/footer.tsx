import type { FC } from 'react';
import Link from 'next/link';

const Footer: FC = () => {
  return (
    <footer className="border-t bg-background py-4 text-sm text-muted-foreground">
      <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 text-center md:flex-row md:px-6">
        <p>
          Powered by Wikimedia API, Google Gemini, and Vercel.
        </p>
        <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-foreground">
            Report a bug
          </Link>
          <Link href="#" className="hover:text-foreground">
            Star us on GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
