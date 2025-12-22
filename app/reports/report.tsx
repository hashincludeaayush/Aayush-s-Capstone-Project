import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./report.css"; // Assuming you have a CSS file for styling

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/reports/report" element={<div className="center">Hello World</div>} />
          <div className="center">Hello World</div>
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </Router>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
