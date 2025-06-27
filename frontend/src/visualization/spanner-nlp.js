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

import GraphServer from '../graph-server.js';
import GraphStore from '../spanner-store.js';
import GraphConfig from '../spanner-config.js';

/**
 * NLP Query Interface for Spanner Graph
 */
class SpannerNLP {
    constructor(server, store, mount) {
        this.server = server;
        this.store = store;
        this.mount = mount;
        this.isExpanded = false;
        
        this.scaffold();
        this.initializeEvents();
    }

    scaffold() {
        const nlpContainer = document.createElement('div');
        nlpContainer.className = 'nlp-container';
        nlpContainer.innerHTML = `
            <style>
                .nlp-container {
                    position: relative;
                    margin-right: 16px;
                }
                
                .nlp-toggle {
                    background: #1a73e8;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .nlp-toggle:hover {
                    background: #1557b0;
                }
                
                .nlp-panel {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border: 1px solid #dadce0;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    padding: 16px;
                    width: 400px;
                    z-index: 1000;
                    display: none;
                }
                
                .nlp-panel.expanded {
                    display: block;
                }
                
                .nlp-input-group {
                    margin-bottom: 16px;
                }
                
                .nlp-input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #dadce0;
                    border-radius: 4px;
                    font-size: 14px;
                    resize: vertical;
                    min-height: 60px;
                }
                
                .nlp-input:focus {
                    outline: none;
                    border-color: #1a73e8;
                    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
                }
                
                .nlp-controls {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                
                .nlp-type-select {
                    padding: 8px 12px;
                    border: 1px solid #dadce0;
                    border-radius: 4px;
                    font-size: 14px;
                }
                
                .nlp-button {
                    padding: 8px 16px;
                    border: 1px solid #dadce0;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                    font-size: 14px;
                }
                
                .nlp-button:hover {
                    background: #f8f9fa;
                }
                
                .nlp-button.primary {
                    background: #1a73e8;
                    color: white;
                    border-color: #1a73e8;
                }
                
                .nlp-button.primary:hover {
                    background: #1557b0;
                }
                
                .nlp-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .nlp-result {
                    margin-top: 16px;
                    padding: 12px;
                    border-radius: 4px;
                    font-size: 14px;
                    max-height: 200px;
                    overflow-y: auto;
                }
                
                .nlp-result.success {
                    background: #e8f5e8;
                    border: 1px solid #c6e5c6;
                }
                
                .nlp-result.error {
                    background: #fce8e6;
                    border: 1px solid #f5c6cb;
                    color: #721c24;
                }
                
                .nlp-query-display {
                    background: #f8f9fa;
                    padding: 8px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 12px;
                    margin-bottom: 8px;
                    white-space: pre-wrap;
                }
                
                .nlp-examples {
                    margin-top: 16px;
                    border-top: 1px solid #dadce0;
                    padding-top: 16px;
                }
                
                .nlp-examples h4 {
                    margin: 0 0 8px 0;
                    font-size: 14px;
                    color: #5f6368;
                }
                
                .nlp-example {
                    background: #f8f9fa;
                    padding: 8px;
                    border-radius: 4px;
                    margin-bottom: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .nlp-example:hover {
                    background: #e8f0fe;
                }
            </style>
            
            <button class="nlp-toggle" title="Ask questions in natural language">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                Ask in Natural Language
            </button>
            
            <div class="nlp-panel">
                <div class="nlp-input-group">
                    <textarea class="nlp-input" placeholder="Ask a question about your data...\n\nExamples:\n• Show me all the users\n• Find connections between Person A and Person B\n• What companies does John work for?\n• Count all the products"></textarea>
                </div>
                
                <div class="nlp-controls">
                    <select class="nlp-type-select">
                        <option value="auto">Auto-detect</option>
                        <option value="sql">SQL</option>
                        <option value="gql">GQL</option>
                    </select>
                    <button class="nlp-button" data-action="generate">Generate Query</button>
                    <button class="nlp-button primary" data-action="execute">Ask & Execute</button>
                </div>
                
                <div class="nlp-result" style="display: none;"></div>
                
                <div class="nlp-examples">
                    <h4>Example Questions:</h4>
                    <div class="nlp-example" data-example="Show me all the people in the database">Show me all the people in the database</div>
                    <div class="nlp-example" data-example="Find all connections between users">Find all connections between users</div>
                    <div class="nlp-example" data-example="Count the total number of nodes">Count the total number of nodes</div>
                    <div class="nlp-example" data-example="What are the most common relationships?">What are the most common relationships?</div>
                </div>
            </div>
        `;
        
        this.mount.appendChild(nlpContainer);
        
        // Store references to elements
        this.toggleButton = nlpContainer.querySelector('.nlp-toggle');
        this.panel = nlpContainer.querySelector('.nlp-panel');
        this.input = nlpContainer.querySelector('.nlp-input');
        this.typeSelect = nlpContainer.querySelector('.nlp-type-select');
        this.generateButton = nlpContainer.querySelector('[data-action="generate"]');
        this.executeButton = nlpContainer.querySelector('[data-action="execute"]');
        this.result = nlpContainer.querySelector('.nlp-result');
        this.examples = nlpContainer.querySelectorAll('.nlp-example');
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!nlpContainer.contains(e.target)) {
                this.closePanel();
            }
        });
    }
    
    initializeEvents() {
        // Toggle panel
        this.toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel();
        });
        
        // Generate query button
        this.generateButton.addEventListener('click', () => {
            this.generateQuery();
        });
        
        // Execute query button
        this.executeButton.addEventListener('click', () => {
            this.executeQuery();
        });
        
        // Example clicks
        this.examples.forEach(example => {
            example.addEventListener('click', () => {
                this.input.value = example.dataset.example;
                this.input.focus();
            });
        });
        
        // Enter key in input
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.executeQuery();
            }
        });
    }
    
    togglePanel() {
        this.isExpanded = !this.isExpanded;
        if (this.isExpanded) {
            this.panel.classList.add('expanded');
            this.input.focus();
        } else {
            this.panel.classList.remove('expanded');
        }
    }
    
    closePanel() {
        this.isExpanded = false;
        this.panel.classList.remove('expanded');
    }
    
    async generateQuery() {
        const question = this.input.value.trim();
        if (!question) {
            this.showError('Please enter a question');
            return;
        }
        
        this.setLoading(true);
        this.showResult('Generating query...', 'info');
        
        try {
            const result = await this.server.nlpGenerate(question, this.typeSelect.value);
            
            if (result.success) {
                this.showQueryResult(result);
            } else {
                this.showError(result.error || 'Failed to generate query');
            }
        } catch (error) {
            this.showError('Error generating query: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    }
    
    async executeQuery() {
        const question = this.input.value.trim();
        if (!question) {
            this.showError('Please enter a question');
            return;
        }
        
        this.setLoading(true);
        this.showResult('Processing your question...', 'info');
        
        try {
            const result = await this.server.nlpQuery(question, this.typeSelect.value);
            
            if (result.error) {
                this.showError(result.error);
            } else if (result.response) {
                // Update the main visualization with new data
                this.updateVisualization(result.response);
                this.showSuccess('Query executed successfully!');
                this.closePanel();
            } else {
                this.showError('Unexpected response format');
            }
        } catch (error) {
            this.showError('Error executing query: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    }
    
    showQueryResult(result) {
        const content = `
            <strong>Generated Query (${result.query_type}):</strong>
            <div class="nlp-query-display">${result.query}</div>
            <button class="nlp-button primary" onclick="navigator.clipboard.writeText('${result.query.replace(/'/g, "\\'")}'); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy Query', 2000);">Copy Query</button>
        `;
        this.showResult(content, 'success');
    }
    
    showResult(content, type) {
        this.result.innerHTML = content;
        this.result.className = `nlp-result ${type}`;
        this.result.style.display = 'block';
    }
    
    showError(message) {
        this.showResult(`<strong>Error:</strong> ${message}`, 'error');
    }
    
    showSuccess(message) {
        this.showResult(message, 'success');
    }
    
    setLoading(isLoading) {
        this.generateButton.disabled = isLoading;
        this.executeButton.disabled = isLoading;
        if (isLoading) {
            this.executeButton.textContent = 'Processing...';
        } else {
            this.executeButton.textContent = 'Ask & Execute';
        }
    }
    
    updateVisualization(responseData) {
        // Update the store with new data, similar to how regular queries work
        const {
            nodes,
            edges,
            raw_results,
            query,
            query_type,
            question,
            column_names,
            column_types,
            row_count
        } = responseData;
        
        // Create a new config with the response data
        const graphConfig = new GraphConfig({
            nodesData: nodes || [],
            edgesData: edges || [],
            colorScheme: GraphConfig.ColorScheme.LABEL,
            rowsData: raw_results || [],
            queryResult: {
                query: query,
                query_type: query_type,
                question: question,
                results: raw_results,
                column_names: column_names,
                column_types: column_types,
                row_count: row_count
            }
        });
        
        // Update the store
        this.store.updateConfig(graphConfig);
    }
}

export default SpannerNLP;
