import './globals.css';

export const metadata = {
  title: 'Blood Bank Hub',
  description: 'Modern full-stack blood bank management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
