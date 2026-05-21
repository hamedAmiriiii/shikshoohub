import React from 'react';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import GallerySection from './components/GallerySection';
import PricingSection from './components/PricingSection';
import Footer from './components/Footer';
import Navbar from './components/Navbar';

export default function LandingPage() {
  return (
    <div style={{maxWidth:"none !important"}} className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <GallerySection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
