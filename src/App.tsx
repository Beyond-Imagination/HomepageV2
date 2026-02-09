import React, {Suspense} from 'react';
import {useRoutes} from 'react-router-dom';
import Layout from '@/components/Layout';

// Lazy load pages for better performance
const Home = React.lazy(() => import('@/pages/Home'));
const Contact = React.lazy(() => import('@/pages/Contact'));
const Gallery = React.lazy(() => import('@/pages/Gallery'));
const Projects = React.lazy(() => import('@/pages/Projects'));
const Team = React.lazy(() => import('@/pages/Team'));

// Loading component
const Loading = () => <div className="p-4">Loading...</div>;

export default function App() {
    return useRoutes([
        {
            path: '/',
            element: <Layout/>,
            children: [
                {index: true, element: <Suspense fallback={<Loading/>}><Home/></Suspense>},
                {path: 'contact', element: <Suspense fallback={<Loading/>}><Contact/></Suspense>},
                {path: 'gallery', element: <Suspense fallback={<Loading/>}><Gallery/></Suspense>},
                {path: 'projects', element: <Suspense fallback={<Loading/>}><Projects/></Suspense>},
                {path: 'team', element: <Suspense fallback={<Loading/>}><Team/></Suspense>},
            ],
        },
    ]);
}
