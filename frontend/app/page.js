import CustomCursor from "./components/CustomCursor";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import UploadSection from "./components/UploadSection";
import Dashboard from "./components/Dashboard";
import ChartsSection from "./components/ChartsSection";
import TabsSection from "./components/TabsSection";
import Footer from "./components/Footer";
import AnimeCharacters from "./components/AnimeCharacters";
import { AnalysisProvider } from "./context/AnalysisContext";

export default function Home() {
  return (
    <AnalysisProvider>
      <CustomCursor />
      <AnimeCharacters />
      <Navbar />
      <main>
        <Hero />
        <UploadSection />
        <Dashboard />
        <ChartsSection />
        <TabsSection />
      </main>
      <Footer />
    </AnalysisProvider>
  );
}
