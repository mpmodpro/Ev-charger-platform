import React from 'react';

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
      <a className="navbar-brand" href="/">
        ⚡ Charger Manager
      </a>
      <div className="collapse navbar-collapse">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item">
            <a className="nav-link" href="/">View Chargers</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/add">Add Charger</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
