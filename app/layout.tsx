import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sei invitato — DJ Set',
  description: 'DJ set in casa. Scrivimi su WhatsApp o entra nel gruppo per tutti i dettagli.',
  robots: { index: false, follow: false },
  themeColor: '#05040a',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
  openGraph: {
    title: 'Sei invitato — DJ Set in casa',
    description: 'Scrivimi su WhatsApp o entra nel gruppo per tutti i dettagli 🎧',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
