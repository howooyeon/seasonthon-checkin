import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CheckinPage from './components/CheckinPage';
import AdminPage from './components/AdminPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/checkin/:eventCode" element={<CheckinPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;