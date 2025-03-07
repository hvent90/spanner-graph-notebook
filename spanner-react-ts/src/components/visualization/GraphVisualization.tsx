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
import styled from 'styled-components';
import ForceGraph from './ForceGraph';
import Sidebar from './Sidebar';
import { useGraph } from '../../contexts';

const VisualizationContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-size: 1.2rem;
  color: #333;
`;

const GraphContainer = styled.div`
  width: 100%;
  height: 100%;
`;

const GraphVisualization: React.FC = () => {
  const { loading } = useGraph();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const graphContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (graphContainerRef.current) {
        setDimensions({
          width: graphContainerRef.current.clientWidth,
          height: graphContainerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  return (
    <VisualizationContainer>
      <GraphContainer ref={graphContainerRef}>
        <ForceGraph width={dimensions.width} height={dimensions.height} />
        {loading && (
          <LoadingOverlay>
            <div>Loading graph data...</div>
          </LoadingOverlay>
        )}
      </GraphContainer>
      <Sidebar />
    </VisualizationContainer>
  );
};

export default GraphVisualization; 