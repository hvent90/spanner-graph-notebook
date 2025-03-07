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
import styled from 'styled-components';

const FloatingContainer = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 100px;
  box-shadow: 0 4px 12px rgba(60, 64, 67, 0.1);
  z-index: 1000;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 8px 16px rgba(60, 64, 67, 0.1);
  }
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  background: transparent;
  color: #3c4043;
  border: 1px solid #e0e0e0;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #f8f9fa;
    border-color: #1a73e8;
  }
  
  &.active {
    background: #1a73e8;
    color: white;
    border-color: #1a73e8;
  }
`;

interface FloatingActionButtonProps {
  onClick: () => void;
  title?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick, 
  title = "Configure (Cmd/Ctrl + K)" 
}) => {
  // Add keyboard shortcut: Cmd/Ctrl + K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClick();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClick]);
  
  return (
    <FloatingContainer>
      <ActionButton onClick={onClick} title={title}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"></path>
        </svg>
        Configure
      </ActionButton>
    </FloatingContainer>
  );
};

export default FloatingActionButton; 