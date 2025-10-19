import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// @ts-ignore: allow importing CSS without type declarations
import './output.css'
// @ts-ignore: allow importing CSS without type declarations
import './styles/animations.css'
// @ts-ignore: allow importing CSS without type declarations
import './maplibre-gl.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
