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

// SVG Icons
const SVG = {
  bubble: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M580-120q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T620-240q0-17-11.5-28.5T580-280q-17 0-28.5 11.5T540-240q0 17 11.5 28.5T580-200Zm80-200q-92 0-156-64t-64-156q0-92 64-156t156-64q92 0 156 64t64 156q0 92-64 156t-156 64Zm0-80q59 0 99.5-40.5T800-620q0-59-40.5-99.5T660-760q-59 0-99.5 40.5T520-620q0 59 40.5 99.5T660-480ZM280-240q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T360-400q0-33-23.5-56.5T280-480q-33 0-56.5 23.5T200-400q0 33 23.5 56.5T280-320Zm300 80Zm80-380ZM280-400Z"/></svg>`,
  table: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm240-240H200v160h240v-160Zm80 0v160h240v-160H520Zm-80-80v-160H200v160h240Zm80 0h240v-160H520v160ZM200-680h560v-80H200v80Z"/></svg>`,
  schema: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M160-40v-240h100v-80H160v-240h100v-80H160v-240h280v240H340v80h100v80h120v-80h280v240H560v-80H440v80H340v80h100v240H160Zm80-80h120v-80H240v80Zm0-320h120v-80H240v80Zm400 0h120v-80H640v80ZM240-760h120v-80H240v80Zm60-40Zm0 320Zm400 0ZM300-160Z"/></svg>`,
  enterFullScreen: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#3C4043"><path d="M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z"/></svg>`,
  exitFullScreen: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#3C4043"><path d="M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z"/></svg>`
};

// Styled components
const MenuContainer = styled.div`
  display: flex;
  align-items: center;
  border-bottom: 1px solid #DADCE0;
  box-sizing: border-box;
  color: #3C4043;
  padding: 16px 24px 16px 16px;
  width: 100%;
  background: #fff;
`;

const ViewToggleGroup = styled.div`
  display: flex;
  align-items: center;
  margin-right: 16px;
  border: 1px solid #DADCE0;
  border-radius: 4px;
  overflow: hidden;
`;

const ViewToggleButton = styled.button<{ active?: boolean, disabled?: boolean }>`
  background: ${props => props.active ? '#E8F0FE' : 'none'};
  border: none;
  padding: 8px;
  display: flex;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  align-items: center;
  justify-content: center;
  border-radius: 0;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:not(:last-child) {
    border-right: 1px solid #DADCE0;
  }
  
  &:hover:not(:disabled, &.active) {
    background-color: rgba(0, 0, 0, 0.04);
  }
  
  svg {
    fill: ${props => props.active ? '#1A73E8' : '#5f6368'};
  }
`;

const DropdownContainer = styled.div`
  margin-right: 16px;
  position: relative;
`;

const DropdownToggle = styled.button<{ disabled?: boolean }>`
  appearance: none;
  background: url("data:image/svg+xml;utf8,<svg fill='rgba(73, 80, 87, 1)' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>") no-repeat;
  background-position: right 10px center;
  background-color: ${props => props.disabled ? '#EBEBE4' : 'white'};
  padding: 12px 40px 12px 16px;
  border: 1px solid ${props => props.disabled ? '#EBEBE4' : '#80868B'};
  border-radius: 4px;
  color: #3C4043;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  text-align: left;
  width: 220px;
  font-family: inherit;
  font-size: .9rem;
`;

const DropdownContent = styled.div<{ show: boolean }>`
  display: ${props => props.show ? 'block' : 'none'};
  position: absolute;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 1;
  top: 100%;
  left: 0;
  padding: 8px 0;
  width: 100%;
`;

const DropdownItem = styled.a<{ selected?: boolean }>`
  color: #495057;
  padding: 8px 32px 8px 8px;
  text-decoration: none;
  display: flex;
  align-items: center;
  background: ${props => props.selected ? 
    "url(\"data:image/svg+xml;utf8,<svg height='24' viewBox='0 0 24 24' width='24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M2 6L5 9L10 3' stroke='rgba(73, 80, 87, 1)' stroke-width='2' stroke-linecap='square'/></svg>\") no-repeat" : 'none'};
  background-position: left 15px top 100%;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const ItemText = styled.span`
  flex: 1;
  font-size: .9rem;
`;

const ElementCount = styled.div`
  color: #000;
  display: flex;
  flex: 1;
  font-weight: 500;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  margin-left: 10px;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 46px;
  height: 24px;
  flex-shrink: 0;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e9ecef;
  transition: .4s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .3s;
    border-radius: 50%;
  }
  
  ${ToggleInput}:checked + & {
    background-color: #228be6;
  }
  
  ${ToggleInput}:checked + &:before {
    transform: translateX(22px);
  }
`;

const ToggleLabel = styled.span`
  margin-left: 8px;
  color: #202124;
  line-height: 24px;
  font-size: .9rem;
`;

const FullscreenContainer = styled.div`
  display: flex;
  align-items: center;
  margin-right: 16px;
  border: 1px solid #DADCE0;
  border-radius: 4px;
  overflow: hidden;
`;

const FullscreenButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
`;

// Define view modes and layout modes enums (similar to the original)
const ViewModes = {
  DEFAULT: { description: 'DEFAULT' },
  TABLE: { description: 'TABLE' },
  SCHEMA: { description: 'SCHEMA' }
};

const LayoutModes = {
  FORCE: { description: 'FORCE' },
  TOP_DOWN: { description: 'TOP_DOWN' },
  LEFT_RIGHT: { description: 'LEFT_RIGHT' },
  RADIAL_IN: { description: 'RADIAL_IN' },
  RADIAL_OUT: { description: 'RADIAL_OUT' }
};

const MenuBar: React.FC = () => {
  const { nodes, edges, isConnected } = useGraph();
  const [viewMode, setViewMode] = useState(ViewModes.DEFAULT);
  const [layoutMode, setLayoutMode] = useState(LayoutModes.FORCE);
  const [showLabels, setShowLabels] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Handle view mode change
  const handleViewModeChange = (mode: typeof ViewModes.DEFAULT) => {
    setViewMode(mode);
    // Here you would implement additional logic based on the view mode
  };
  
  // Handle layout mode change
  const handleLayoutModeChange = (mode: typeof LayoutModes.FORCE) => {
    setLayoutMode(mode);
    setDropdownOpen(false);
    // Here you would implement additional layout logic for the graph
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  return (
    <MenuContainer>
      <ViewToggleGroup>
        <ViewToggleButton 
          active={viewMode === ViewModes.DEFAULT}
          disabled={!isConnected || nodes.length === 0}
          onClick={() => handleViewModeChange(ViewModes.DEFAULT)}
          title="Graph View"
          dangerouslySetInnerHTML={{ __html: SVG.bubble }}
        />
        <ViewToggleButton 
          active={viewMode === ViewModes.TABLE}
          disabled={!isConnected}
          onClick={() => handleViewModeChange(ViewModes.TABLE)}
          title="Table View"
          dangerouslySetInnerHTML={{ __html: SVG.table }}
        />
        <ViewToggleButton 
          active={viewMode === ViewModes.SCHEMA}
          disabled={!isConnected}
          onClick={() => handleViewModeChange(ViewModes.SCHEMA)}
          title="Schema View"
          dangerouslySetInnerHTML={{ __html: SVG.schema }}
        />
      </ViewToggleGroup>
      
      <DropdownContainer>
        <DropdownToggle 
          disabled={!isConnected || viewMode !== ViewModes.DEFAULT} 
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {layoutMode.description.replace(/_/g, ' ').charAt(0) + layoutMode.description.replace(/_/g, ' ').slice(1).toLowerCase()}
        </DropdownToggle>
        <DropdownContent show={dropdownOpen && isConnected && viewMode === ViewModes.DEFAULT}>
          {Object.entries(LayoutModes).map(([key, mode]) => (
            <DropdownItem 
              key={key}
              href="#"
              selected={layoutMode === mode}
              onClick={(e) => {
                e.preventDefault();
                handleLayoutModeChange(mode);
              }}
            >
              <ItemText>
                {mode.description.replace(/_/g, ' ').charAt(0) + mode.description.replace(/_/g, ' ').slice(1).toLowerCase()}
              </ItemText>
            </DropdownItem>
          ))}
        </DropdownContent>
      </DropdownContainer>
      
      <ElementCount>
        {nodes.length} nodes, {edges.length} edges
      </ElementCount>
      
      <ToggleContainer>
        <ToggleSwitch>
          <ToggleInput 
            type="checkbox" 
            checked={showLabels}
            onChange={() => setShowLabels(!showLabels)}
            disabled={!isConnected || viewMode !== ViewModes.DEFAULT}
          />
          <ToggleSlider />
        </ToggleSwitch>
        <ToggleLabel>Show labels</ToggleLabel>
      </ToggleContainer>
      
      <FullscreenContainer>
        <FullscreenButton 
          onClick={toggleFullscreen}
          dangerouslySetInnerHTML={{ __html: isFullscreen ? SVG.exitFullScreen : SVG.enterFullScreen }}
        />
      </FullscreenContainer>
    </MenuContainer>
  );
};

export default MenuBar; 