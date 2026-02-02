import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App.jsx'
import './index.css'

// 1. Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // Data is fresh for 1 minute
      refetchOnWindowFocus: false, // Don't reload just because I clicked away
      retry: 1, // Only retry failed requests once
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Provide the client to your App */}
    <QueryClientProvider client={queryClient}>
      <App />
      
      {/* 3. Add the DevTools (Floating icon in bottom-right) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
)