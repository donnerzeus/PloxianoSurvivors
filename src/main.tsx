import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('Main.tsx executing...');

const container = document.getElementById('root');
if (container) {
  console.log('Root found, rendering...');
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} else {
  console.error('Root NOT found!');
}
