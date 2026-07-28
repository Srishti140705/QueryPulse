import React from 'react'

export default function About() {
  return <div className="about-pixel-page">
    <main className="about-content">
      <section className="about-intro">
        <div><p>ABOUT</p><h1>About QueryPulse</h1><article>QueryPulse is an AI-assisted SQL workspace designed to make database work simpler, faster, and more organized. It brings query writing, execution, analysis, database connections, history, and AI assistance together in one place.</article></div>
        <div className="about-hero-art" aria-hidden="true">
          <span className="about-code">&lt;/&gt;</span>
          <div className="about-disks"><i/><i/><i/></div>
          <div className="about-monitor"><b/><b/><b/><b/></div>
        </div>
      </section>
      <section className="about-cards">
        <article className="about-card features"><span>★</span><div><h2>Core Features</h2><p>SQL editor, result tables, query history, saved connections, execution plans, static analysis, charts, and AI-powered SQL assistance.</p></div></article>
        <article className="about-card goal"><span>◉</span><div><h2>Project Goal</h2><p>To create an approachable and visually engaging SQL workspace that helps users understand, improve, and manage their queries more confidently.</p></div></article>
      </section>
      <section className="about-tech"><span className="about-chip">▣</span><div><h2>Technology</h2><div className="about-tech-list"><b>React</b><b>Vite</b><b>FastAPI</b><b>MySQL</b><b>Ollama</b></div></div></section>
    </main>
  </div>
}
