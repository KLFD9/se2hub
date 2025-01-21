import { BrowserRouter as Router } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { NewsSection } from './components/NewsSection';
import { FeaturesGrid } from './components/FeaturesGrid';
import { ServerRentalSection } from './components/ServerRentalSection';
import { Footer } from './components/Footer'
import './styles/App.css'

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main>
          <Hero />          
          <NewsSection />
          <FeaturesGrid />
          <ServerRentalSection />
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
