import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Toaster } from '@/components/Toaster'

export const metadata: Metadata = {
  title: 'PlateKarma — The Road\'s Reputation System',
  description: 'Look up any license plate\'s driving reputation. Log bad (or great) drivers and build the community road record.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '0 1rem 5rem' }}>
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}
