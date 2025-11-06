import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import InstallPWA from "@/components/InstallPWA";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import Providers from "./providers";

export const metadata = {
  title: "Loan Management System",
  description: "Personal loan tracking and statistics app",
  manifest: "/manifest.json",
  themeColor: "#16a34a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen w-full bg-gradient-to-br from-green-50 via-white to-green-100 text-slate-800">
        <ServiceWorkerRegistration />
        <Providers>
          <Navbar />
          <div className="flex-grow flex flex-col">
            <main className="flex-grow w-full px-4 md:px-8 py-10 md:py-12">{children}</main>
            <Footer />
          </div>
          <ScrollToTop />
          <InstallPWA />
        </Providers>
      </body>
    </html>
  );
}
