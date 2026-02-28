import { lazy } from 'react'
import { useRoutes } from 'react-router-dom'
import Layout from '@/components/Layout'

const Home = lazy(() => import('@/pages/Home'))
const Contact = lazy(() => import('@/pages/Contact'))
const Gallery = lazy(() => import('@/pages/Gallery'))
const Projects = lazy(() => import('@/pages/Projects'))
const Team = lazy(() => import('@/pages/Team'))

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
