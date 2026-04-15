import './globals.css';

export const metadata = {
  title: 'IKEA My Space',
  description: 'Upload a photo of your mess. Get a tidy IKEA reorganization back.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
