import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Luster AI - Real Estate Photo Enhancement',
  description: 'Transform your real estate photos with AI-powered enhancement',
  keywords: ['real estate', 'photo enhancement', 'AI', 'property photography'],
  authors: [{ name: 'Luster AI Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#f5a647',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-sans bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  )
}