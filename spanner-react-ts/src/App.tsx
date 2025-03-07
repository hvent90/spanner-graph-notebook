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

import React, { useEffect, useState } from 'react';
import './App.css';
import { GraphProvider, useGraph } from './contexts';
import { 
  GraphVisualization, 
  ConfigPanel,
  FloatingActionButton,
  MenuBar
} from './components';

// ServerStatusIndicator displays the connection status and allows retrying connections
const ServerStatusIndicator: React.FC = () => {
  const { isConnected, checkConnection, error } = useGraph();
  
  const handleRetryConnection = async () => {
    await checkConnection();
  };
  
  return (
    <div className="server-status-indicator">
      <div className={`status-icon ${isConnected ? 'connected' : 'disconnected'}`} />
      <div className="status-text">
        {isConnected ? 'Connected to server' : 'Disconnected from server'}
      </div>
      {!isConnected && (
        <button className="retry-button" onClick={handleRetryConnection}>
          Retry Connection
        </button>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

// MainApplication component renders our primary application UI
const MainApplication: React.FC = () => {
  const { loading } = useGraph();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // Open the config panel automatically on first load
  useEffect(() => {
    // Show the config panel by default when the app loads
    setIsConfigOpen(true);
  }, []);
  
  const toggleConfigPanel = () => {
    setIsConfigOpen(!isConfigOpen);
  };
  
  return (
    <div className="app-container">
      <MenuBar />
      <div className="app-content">
        <div className="visualization-container">
          <GraphVisualization />
        </div>
      </div>
      
      {/* Loading overlay */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div>Loading graph data...</div>
        </div>
      )}
      
      {/* Server status indicator */}
      <ServerStatusIndicator />
      
      {/* Floating action button */}
      <FloatingActionButton onClick={toggleConfigPanel} />
      
      {/* Configuration panel */}
      <ConfigPanel isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </div>
  );
};

function App() {
  return (
    <GraphProvider>
      <div className="App">
        <MainApplication />
      </div>
    </GraphProvider>
  );
}

export default App;
