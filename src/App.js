import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./HomePage";
import GuideCreator from "./GuideCreator";
import GuideEditor from "./GuideEditor";

const App = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<GuideCreator />} />
          <Route path="/edit/:guideId" element={<GuideEditor />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
