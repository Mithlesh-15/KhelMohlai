import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './components/NavBar';
import BottemBar from './components/BottomBar';
import { Analytics } from "@vercel/analytics/react"

function App() {
  return (
    <div className="app-shell">
      <NavBar />
      <Outlet />
      <BottemBar />
      <Analytics />
    </div>
  );
}

export default App;
