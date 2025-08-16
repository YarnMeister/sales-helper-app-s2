import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RTSE Sales Helper',
  description: 'RTSE Sales Helper Application - Streamline your sales process',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon-180x180.svg', sizes: '180x180', type: 'image/svg+xml' },
      { url: '/apple-touch-icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml' },
      { url: '/apple-touch-icon-120x120.svg', sizes: '120x120', type: 'image/svg+xml' },
      { url: '/apple-touch-icon-76x76.svg', sizes: '76x76', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RTSE Sales Helper',
  },
}

export const viewport: Viewport = {
  themeColor: '#ED1C24',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.svg" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.svg" />
        <meta name="theme-color" content="#ED1C24" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RTSE Sales Helper" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
