import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="font-sans antialiased min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
