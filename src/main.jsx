import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.jsx';
import Login from './pages/Login.jsx';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import Match from './pages/Match.jsx';
import LeaderBoard from './pages/LeaderBoard.jsx';
import Home from './pages/Home.jsx';
import Clear from './pages/Clear.jsx';
import StatsPage from './pages/Stats.jsx';
import { queryClient } from './lib/queryClient';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="leaderboard" element={<LeaderBoard />} />
        <Route path="stats" element={<StatsPage />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/match/:matchId" element={<Match />} />
      <Route path="/clear" element={<Clear />} />
    </>,
  ),
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
