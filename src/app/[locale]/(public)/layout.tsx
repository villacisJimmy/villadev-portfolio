import { Navbar } from "@/components/Navbar/Navbar";
import { Footer } from "@/components/Footer/Footer";
import { NetworkCanvas } from "@/components/NetworkCanvas/NetworkCanvas";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NetworkCanvas />
      <Navbar />
      <main className="shell" id="top">
        {children}
      </main>
      <Footer />
    </>
  );
}
