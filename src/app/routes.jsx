import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '../components/Layout';

// Lazy load pages for code splitting
const AiosOverview = lazy(() => import('../features/aios/AiosOverview'));
const AiosTasks = lazy(() => import('../features/aios/AiosTasks'));
const AiosSkills = lazy(() => import('../features/aios/AiosSkills'));
const AiosSkillDetail = lazy(() => import('../features/aios/AiosSkillDetail'));
const AiosDepartment = lazy(() => import('../features/aios/AiosDepartment'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-3">
      <div className="spinner spinner-lg" />
      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
    </div>
  </div>
);

const RootLayout = () => (
  <Layout>
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  </Layout>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <AiosOverview /> },
      { path: 'tasks', element: <AiosTasks /> },
      { path: 'skills', element: <AiosSkills /> },
      { path: 'skills/:slug', element: <AiosSkillDetail /> },
      { path: 'department/:slug', element: <AiosDepartment /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
