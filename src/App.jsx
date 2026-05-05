import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './components/NavBar';
import BottemBar from './components/BottomBar';

function App() {
  return (
    <div className="app-shell">
      <NavBar />
      <Outlet />
      <BottemBar />
    </div>
  );
}

export default App;
