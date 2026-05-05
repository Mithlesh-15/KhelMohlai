import React from 'react';
import NavBar from "./components/NavBar"
import BottemBar from "./components/BottomBar"
function App() {
  return (
    <>
      <div className="app-shell">
        <NavBar />
        <BottemBar /> 
      </div>
    </>
  );
}

export default App;
