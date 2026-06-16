import type { Metadata } from "next"
import "../index.css"
import "../App.css"

export const metadata: Metadata = {
  title: "KSP CrimeIQ",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
      </head>
      <body>{children}</body>
    </html>
  )
}
