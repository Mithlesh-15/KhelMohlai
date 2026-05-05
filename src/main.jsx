import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
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

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="leaderboard" element={<LeaderBoard />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/match/:matchId" element={<Match />} />
    </>,
  ),
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
