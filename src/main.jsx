import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
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
import { queryClient } from './lib/queryClient';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="leaderboard" element={<LeaderBoard />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/match/:matchId" element={<Match />} />
      <Route path="/clear" element={<Clear />} />
    </>,
  ),
);

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'khelmohlai-query-cache-v1',
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,
      }}
    >
      <RouterProvider router={router} />
    </PersistQueryClientProvider>
  </StrictMode>,
);
