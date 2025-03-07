/**
 * Copyright 2025 Google LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import './Navbar.css';

/**
 * Navbar component for the application
 * Displays the application title and any navigation controls
 */
const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src="/logo.svg" alt="Spanner Graph" className="navbar-logo-image" />
        <h1 className="navbar-title">Spanner Graph Explorer</h1>
      </div>
      <div className="navbar-actions">
        {/* Additional navigation actions can be added here */}
      </div>
    </nav>
  );
};

export default Navbar; 