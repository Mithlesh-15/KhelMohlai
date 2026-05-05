import React from 'react';
import NavBar from "./components/NavBar"
import BottemBar from "./components/BottomBar"
import Home from './pages/Home';
function App() {
  return (
    <>
      <div className="app-shell">
        <NavBar />
        <Home />
        <BottemBar /> 
      </div>
    </>
  );
}

export default App;
