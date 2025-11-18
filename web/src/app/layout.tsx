import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MJCP - Sistema de Escalas',
  description: 'Sistema de gerenciamento de escalas, voluntários e ministérios para igreja',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
