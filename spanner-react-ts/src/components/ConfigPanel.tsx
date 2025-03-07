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

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGraph } from '../contexts';

// Styled components for the config panel
const Overlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  opacity: ${props => props.isOpen ? 1 : 0};
  pointer-events: ${props => props.isOpen ? 'all' : 'none'};
  transition: opacity 0.2s ease;
  z-index: 1000;
`;

const Panel = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(${props => props.isOpen ? 1 : 0.95});
  width: 600px;
  max-height: 90vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 12px 24px rgba(60, 64, 67, 0.1);
  opacity: ${props => props.isOpen ? 1 : 0};
  pointer-events: ${props => props.isOpen ? 'all' : 'none'};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    width: 90%;
  }
`;

const PanelHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #3c4043;
`;

const KeyboardHint = styled.span`
  color: #5f6368;
  font-size: 12px;
`;

const PanelContent = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.div`
  font-size: 12px;
  text-transform: uppercase;
  color: #5f6368;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
`;

const ConnectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
`;

const ConnectionField = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  background: transparent;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #1a73e8;
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
  }
`;

const Label = styled.label`
  position: absolute;
  left: 8px;
  top: 0;
  transform: translateY(-50%);
  background: white;
  padding: 0 4px;
  font-size: 12px;
  color: #5f6368;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 0;
`;

const Toggle = styled.input`
  appearance: none;
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: #e0e0e0;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    left: 2px;
    top: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    transition: all 0.2s ease;
  }
  
  &:checked {
    background: #1a73e8;
  }
  
  &:checked::after {
    transform: translateX(16px);
  }
`;

const ToggleLabel = styled.label`
  font-size: 14px;
  color: #3c4043;
  user-select: none;
`;

const QueryEditor = styled.div`
  position: relative;
  margin-top: 24px;
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 150px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  background: transparent;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #1a73e8;
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 8px 16px;
  border: ${props => props.primary ? 'none' : '1px solid #e0e0e0'};
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.primary ? '#1a73e8' : 'transparent'};
  color: ${props => props.primary ? 'white' : '#3c4043'};
  
  &:hover {
    box-shadow: 0 1px 3px rgba(60, 64, 67, 0.1);
    background: ${props => props.primary ? '#1557b0' : '#f8f9fa'};
  }
`;

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_QUERY = `GRAPH MyGraph
MATCH p = (a)-[e]->(b)
RETURN TO_JSON(p) AS path_json
LIMIT 50`;

const STORAGE_KEY = 'spanner-graph-config';

const ConfigPanel: React.FC<ConfigPanelProps> = ({ isOpen, onClose }) => {
  const { executeQuery, isConnected } = useGraph();
  
  const [projectId, setProjectId] = useState('my-project');
  const [instanceId, setInstanceId] = useState('my-instance');
  const [database, setDatabase] = useState('my-database');
  const [useMockData, setUseMockData] = useState(true);
  const [query, setQuery] = useState(DEFAULT_QUERY);
  
  // Load saved configuration from localStorage when component mounts
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setProjectId(config.project || 'my-project');
        setInstanceId(config.instance || 'my-instance');
        setDatabase(config.database || 'my-database');
        setQuery(config.query || DEFAULT_QUERY);
        
        // Only set mock data if it's explicitly defined in the config
        if (config.mock !== undefined) {
          setUseMockData(config.mock);
        }
        
        console.log('Loaded configuration from localStorage:', config);
      } catch (error) {
        console.error('Error parsing saved configuration:', error);
      }
    }
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create the config object
    const config = {
      project: projectId,
      instance: instanceId,
      database: database,
      query: query,
      mock: useMockData
    };
    
    // Save configuration to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    console.log('Saved configuration to localStorage:', config);
    
    // Create params object with form values
    const params = {
      project: projectId,
      instance: instanceId,
      database: database,
      graph: '',
      mock: useMockData
    };
    
    // Execute the query with params
    executeQuery(query, params);
    
    // Close the panel
    onClose();
  };
  
  // Handle key press events (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  return (
    <>
      <Overlay isOpen={isOpen} onClick={onClose} />
      <Panel isOpen={isOpen}>
        <PanelHeader>
          <Title>Configure Visualization</Title>
          <KeyboardHint>ESC to close</KeyboardHint>
        </PanelHeader>
        
        <PanelContent>
          <form onSubmit={handleSubmit}>
            <Section>
              <ConnectionGrid>
                <ConnectionField>
                  <Label htmlFor="project">Project ID</Label>
                  <Input 
                    type="text" 
                    id="project" 
                    value={projectId} 
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="Enter project ID"
                  />
                </ConnectionField>
                <ConnectionField>
                  <Label htmlFor="instance">Instance ID</Label>
                  <Input 
                    type="text" 
                    id="instance" 
                    value={instanceId} 
                    onChange={(e) => setInstanceId(e.target.value)}
                    placeholder="Enter instance ID"
                  />
                </ConnectionField>
                <ConnectionField>
                  <Label htmlFor="database">Database</Label>
                  <Input 
                    type="text" 
                    id="database" 
                    value={database} 
                    onChange={(e) => setDatabase(e.target.value)}
                    placeholder="Enter database name"
                  />
                </ConnectionField>
              </ConnectionGrid>
              <ToggleContainer>
                <Toggle 
                  type="checkbox" 
                  id="mock" 
                  checked={useMockData} 
                  onChange={(e) => setUseMockData(e.target.checked)}
                />
                <ToggleLabel htmlFor="mock">Use mock data</ToggleLabel>
              </ToggleContainer>
              
              <div>
                {isConnected ? 
                  <span style={{ color: '#34a853', fontSize: '14px' }}>✓ Connected to server</span> : 
                  <span style={{ color: '#ea4335', fontSize: '14px' }}>✗ Not connected to server</span>
                }
              </div>
            </Section>
            
            <Section>
              <SectionTitle>Query</SectionTitle>
              <QueryEditor>
                <Textarea 
                  id="query" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={DEFAULT_QUERY}
                />
              </QueryEditor>
            </Section>
            
            <ButtonContainer>
              <Button type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit" primary>Visualize Graph</Button>
            </ButtonContainer>
          </form>
        </PanelContent>
      </Panel>
    </>
  );
};

export default ConfigPanel; 