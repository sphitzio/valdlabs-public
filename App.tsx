import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Studio } from './components/Studio';
import { ProductsSection } from './components/ProductsSection';
import { Waitlist } from './components/Waitlist';
import { Footer } from './components/Footer';
//import { LoginScreen } from './components/LoginScreen';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <Navbar />
      <Hero />
      <Studio />
      <ProductsSection />
      <Waitlist />
      <Footer />
    </div>
  );
};

export default App;
