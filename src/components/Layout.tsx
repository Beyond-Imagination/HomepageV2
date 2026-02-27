import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useOutlet } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()
  const outlet = useOutlet()

  return (
    <div className="font-sans antialiased min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
