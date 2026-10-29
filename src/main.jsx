import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ChatWidget from './components/ChatWidget.jsx'
import Home from './pages/Home.jsx'

// Sitio multipágina: cada HTML (index, privacidad, terminos, 404) indica su página con
// <body data-page="...">. Así cada URL es un archivo estático real (compatible con GitHub Pages)
// con su propio título y metadatos, sin necesidad de un router. La portada se carga de inmediato;
// las páginas secundarias, bajo demanda.
const PAGES = {
  home: Home,
  privacidad: lazy(() => import('./pages/Legal.jsx')),
  terminos: lazy(() => import('./pages/Legal.jsx')),
  'not-found': lazy(() => import('./pages/NotFound.jsx')),
}

const page = document.body.dataset.page in PAGES ? document.body.dataset.page : 'home'
const Page = PAGES[page]

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Page doc={page} />
    </Suspense>
    <ChatWidget onHome={page === 'home'} />
  </StrictMode>,
)
