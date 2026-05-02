import React, { useEffect, useState } from 'react';
import { CalculatorPage } from './pages/CalculatorPage';
import { TokensPage } from './pages/TokensPage';
import { RatioPage } from './pages/RatioPage';
import './App.css';

type Page = 'calculator' | 'tokens' | 'ratio';

function getPage(): Page {
  const hash = window.location.hash;
  if (hash === '#/tokens') return 'tokens';
  if (hash === '#/ratio') return 'ratio';
  return 'calculator';
}

export const App: React.FC = () => {
  const [page, setPage] = useState<Page>(getPage);

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '/tokens';
      return;
    }

    const handler = () => setPage(getPage());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Clamp Curve Tool</span>
        <span className="app-desc">CSS clamp() 視覺化工具 · Typography & Spacing</span>
        <nav className="app-nav">
          <a href="#/" className={`nav-link${page === 'calculator' ? ' active' : ''}`}>
            Calculator
          </a>
          <a href="#/tokens" className={`nav-link${page === 'tokens' ? ' active' : ''}`}>
            Tokens
          </a>
          <a href="#/ratio" className={`nav-link${page === 'ratio' ? ' active' : ''}`}>
            Ratio
          </a>
        </nav>
      </header>
      {page === 'calculator' && <CalculatorPage />}
      {page === 'tokens' && <TokensPage />}
      {page === 'ratio' && <RatioPage />}
    </div>
  );
};
