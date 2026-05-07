import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cuchillo en Boca',
  description: 'Entrenamiento sin excusas',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
