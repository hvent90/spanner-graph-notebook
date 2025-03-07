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

import React, { useState } from 'react';
import styled from 'styled-components';
import { useGraph } from '../../contexts';

const SidebarContainer = styled.div`
  position: absolute;
  top: 70px;
  right: 20px;
  min-width: 300px;
  max-width: 300px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  padding: 1rem;
  display: ${props => props.hidden ? 'none' : 'block'};
`;

const SidebarTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #999;
  
  &:hover {
    color: #666;
  }
`;

const SidebarSection = styled.div`
  margin-bottom: 1.5rem;
`;

const PropertyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PropertyItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.5rem;
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
`;

const PropertyName = styled.div`
  font-weight: bold;
  font-size: 0.875rem;
  color: #555;
`;

const PropertyValue = styled.div`
  font-family: monospace;
  word-break: break-word;
  font-size: 0.875rem;
`;

const LabelDisplay = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const LabelBadge = styled.span`
  padding: 0.25rem 0.5rem;
  background-color: #1976d2;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 0.75rem;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  
  &:hover {
    background-color: #1565c0;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const PlaceholderText = styled.div`
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
  text-align: center;
  margin-top: 2rem;
`;

const SidebarTab = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px 15px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  z-index: 99;
  font-weight: bold;
  color: #1976d2;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const Sidebar: React.FC = () => {
  const { selectedNode, selectedEdge, expandNode, loading, isConnected } = useGraph();
  const [hidden, setHidden] = useState(false);

  const handleExpandNode = (direction: 'INCOMING' | 'OUTGOING') => {
    if (selectedNode) {
      expandNode(selectedNode, direction);
    }
  };

  const renderProperties = (properties: Record<string, any>) => {
    return Object.entries(properties).map(([key, value]) => (
      <PropertyItem key={key}>
        <PropertyName>{key}</PropertyName>
        <PropertyValue>
          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </PropertyValue>
      </PropertyItem>
    ));
  };

  // Show the sidebar tab only if the sidebar is hidden or if no item is selected
  const showSidebarTab = hidden || (!selectedNode && !selectedEdge);

  return (
    <>
      {showSidebarTab && (
        <SidebarTab onClick={() => setHidden(false)}>
          {hidden ? "Show Details" : "Properties"}
        </SidebarTab>
      )}
      
      <SidebarContainer hidden={hidden}>
        {(selectedNode || selectedEdge) && (
          <SidebarTitle>
            {selectedNode ? "Selected Node" : "Selected Edge"}
            <CloseButton onClick={() => setHidden(true)}>×</CloseButton>
          </SidebarTitle>
        )}
        
        {selectedNode && (
          <SidebarSection>
            {selectedNode.labels && selectedNode.labels.length > 0 && (
              <LabelDisplay>
                {selectedNode.labels.map((label) => (
                  <LabelBadge key={label}>{label}</LabelBadge>
                ))}
              </LabelDisplay>
            )}
            
            <ButtonGroup>
              <Button 
                onClick={() => handleExpandNode('INCOMING')} 
                disabled={loading || !isConnected}
              >
                Expand Incoming
              </Button>
              <Button 
                onClick={() => handleExpandNode('OUTGOING')} 
                disabled={loading || !isConnected}
              >
                Expand Outgoing
              </Button>
            </ButtonGroup>
            
            <PropertyList>
              {selectedNode.properties && renderProperties(selectedNode.properties)}
            </PropertyList>
          </SidebarSection>
        )}
        
        {selectedEdge && (
          <SidebarSection>
            {selectedEdge.labels && selectedEdge.labels.length > 0 && (
              <LabelDisplay>
                {selectedEdge.labels.map((label) => (
                  <LabelBadge key={label}>{label}</LabelBadge>
                ))}
              </LabelDisplay>
            )}
            
            <PropertyList>
              {selectedEdge.properties && renderProperties(selectedEdge.properties)}
            </PropertyList>
          </SidebarSection>
        )}
        
        {!selectedNode && !selectedEdge && !hidden && (
          <>
            <SidebarTitle>
              Properties
              <CloseButton onClick={() => setHidden(true)}>×</CloseButton>
            </SidebarTitle>
            <PlaceholderText>
              Select a node or edge to view details
            </PlaceholderText>
          </>
        )}
      </SidebarContainer>
    </>
  );
};

export default Sidebar; 