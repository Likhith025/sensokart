import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import App from './App.jsx'
import './index.css'   // ✅ This should include Tailwind directives
import {BrowserRouter} from 'react-router-dom'
import { CartProvider } from './context/CartContext.jsx'

createRoot(document.getElementById('root')).render(
  <CartProvider>
  <BrowserRouter>
      <App />
  </BrowserRouter>
  </CartProvider>,
)
