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

const QueryBoxContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: #f9f9f9;
  border-bottom: 1px solid #ddd;
`;

const QueryBoxHeader = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
`;

const QueryBoxForm = styled.form`
  display: flex;
  flex-direction: row;
  gap: 1rem;
`;

const QueryInput = styled.textarea`
  flex: 1;
  min-height: 60px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  resize: vertical;
`;

const QueryButton = styled.button`
  padding: 0 1rem;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  
  &:hover {
    background-color: #1565c0;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 0.5rem;
  color: #d32f2f;
  font-size: 0.875rem;
`;

const QueryBox: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const { executeQuery, loading, error } = useGraph();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    try {
      await executeQuery(query);
    } catch (err) {
      console.error('Error executing query:', err);
    }
  };

  return (
    <QueryBoxContainer>
      <QueryBoxHeader>Run Query</QueryBoxHeader>
      <QueryBoxForm onSubmit={handleSubmit}>
        <QueryInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query here..."
          disabled={loading}
        />
        <QueryButton type="submit" disabled={loading || !query.trim()}>
          {loading ? 'Running...' : 'Run'}
        </QueryButton>
      </QueryBoxForm>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </QueryBoxContainer>
  );
};

export default QueryBox; 