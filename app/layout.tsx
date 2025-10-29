import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Providers from "./providers";

export const metadata = {
  title: "Loan Management System",
  description: "Personal loan tracking and statistics app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen w-full bg-gradient-to-br from-green-50 via-white to-green-100 text-slate-800">
        <Providers>
          <Navbar />
          <div className="flex-grow flex flex-col">
            <main className="flex-grow w-full px-4 md:px-8 py-10 md:py-12">{children}</main>
            <Footer />
          </div>
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
