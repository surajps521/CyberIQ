"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"

// Create query client for data fetching
const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {/* Next.js handles routing — no BrowserRouter needed */}
        <Login />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
