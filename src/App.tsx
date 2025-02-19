import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { CommunityGallery } from './components/CommunityGallery'
import { ArticlePage } from './components/ArticlePage'
import { Footer } from './components/Footer'
import { OpenSourceBanner } from './components/OpenSourceBanner'
import SpaceflixPage from './pages/SpaceflixPage'
import ToolsPage from './pages/ToolsPage'
import SpaceCalcPage from './pages/SpaceCalcPage'
import VideoPage from './pages/VideoPage'
import CommunityPage from './pages/CommunityPage'
import './styles/App.css'
import React from 'react'

const HomePage: React.FC = () => (
  <main>
    <Hero />
    <OpenSourceBanner />
    <section className="social-section" id="social-section"></section>
  </main>
)

const App: React.FC = () => (
  <BrowserRouter>
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<CommunityGallery />} />
        <Route path="/article/:id" element={<ArticlePage />} />
        <Route path="/spaceflix" element={<SpaceflixPage />} />
        <Route path="/video/:videoId" element={<VideoPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/tools/spacecalc" element={<SpaceCalcPage />} />
        <Route path="/community" element={<CommunityPage />} />
      </Routes>
      <Footer />
    </div>
  </BrowserRouter>
)
export default App