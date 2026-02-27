import { useRoutes } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Contact from '@/pages/Contact'
import Gallery from '@/pages/Gallery'
import Projects from '@/pages/Projects'
import Team from '@/pages/Team'

export default function App() {
  return useRoutes([
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          index: true,
          element: <Home />,
        },
        {
          path: 'contact',
          element: <Contact />,
        },
        {
          path: 'gallery',
          element: <Gallery />,
        },
        {
          path: 'projects',
          element: <Projects />,
        },
        {
          path: 'team',
          element: <Team />,
        },
      ],
    },
  ])
}
