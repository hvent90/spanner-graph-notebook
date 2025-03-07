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

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode, useRef } from 'react';
import { GraphNode, GraphEdge, SchemaType } from '../models';
import GraphService from '../services/GraphService';
import { QueryParams } from '../services/GraphService';

// Interface for the GraphContext
interface GraphContextType {
  nodes: GraphNode[];
  edges: GraphEdge[];
  schema: SchemaType;
  loading: boolean;
  error: string | null;
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  setSelectedNode: (node: GraphNode | null) => void;
  setSelectedEdge: (edge: GraphEdge | null) => void;
  executeQuery: (query: string, params?: QueryParams) => Promise<void>;
  fetchGraphData: () => Promise<void>;
  expandNode: (node: GraphNode, direction: 'INCOMING' | 'OUTGOING', edgeLabel?: string) => Promise<void>;
  clearSelection: () => void;
  isConnected: boolean;
  checkConnection: () => Promise<boolean>;
}

// Create the context with a default empty value
const GraphContext = createContext<GraphContextType>({
  nodes: [],
  edges: [],
  schema: { nodeTables: [], edgeTables: [] },
  loading: false,
  error: null,
  selectedNode: null,
  selectedEdge: null,
  setSelectedNode: () => {},
  setSelectedEdge: () => {},
  executeQuery: async () => {},
  fetchGraphData: async () => {},
  expandNode: async () => {},
  clearSelection: () => {},
  isConnected: false,
  checkConnection: async () => false,
});

// Props for the GraphProvider component
interface GraphProviderProps {
  children: ReactNode;
}

// GraphProvider component that will wrap the application
export const GraphProvider: React.FC<GraphProviderProps> = ({ children }) => {
  // State for graph data
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [schema, setSchema] = useState<SchemaType>({ nodeTables: [], edgeTables: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Use a ref to track if we've already checked the connection
  const connectionChecked = useRef(false);

  // Initialize the GraphService
  const graphService = React.useMemo(() => new GraphService(), []);

  // Check if the server is connected
  const checkConnection = useCallback(async () => {
    try {
      // Only log the first time we check
      if (!connectionChecked.current) {
        console.log('Checking server connection...');
      }
      
      const connected = await graphService.ping();
      setIsConnected(connected);
      
      if (!connectionChecked.current) {
        connectionChecked.current = true;
        console.log(`Initial connection check result: ${connected}`);
      }
      
      return connected;
    } catch (error) {
      setIsConnected(false);
      console.error('Failed to connect to server:', error);
      return false;
    }
  }, [graphService]);

  // Fetch graph data from the server
  const fetchGraphData = useCallback(async () => {
    if (!isConnected && !connectionChecked.current) {
      const connected = await checkConnection();
      if (!connected) {
        setError('Cannot fetch data: Not connected to server');
        return;
      }
    } else if (!isConnected) {
      setError('Cannot fetch data: Not connected to server');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await graphService.fetchGraphData();
      setNodes(data.nodes);
      setEdges(data.edges);
      setSchema(data.schema);
    } catch (error) {
      console.error('Error fetching graph data:', error);
      setError(`Failed to fetch graph data: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [graphService, isConnected, checkConnection]);

  // Execute a query
  const executeQuery = useCallback(async (query: string, params?: QueryParams) => {
    if (!query.trim()) {
      return fetchGraphData();
    }

    if (!isConnected && !connectionChecked.current) {
      const connected = await checkConnection();
      if (!connected) {
        setError('Cannot execute query: Not connected to server');
        return;
      }
    } else if (!isConnected) {
      setError('Cannot execute query: Not connected to server');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the provided params or default empty values
      const queryParams = params || {
        project: '',
        instance: '',
        database: '',
        graph: '',
        mock: false
      };
      
      const data = await graphService.executeQuery(query, queryParams);
      setNodes(data.nodes);
      setEdges(data.edges);
      // Only update schema if it's provided in the response
      if (data.schema && (data.schema.nodeTables.length > 0 || data.schema.edgeTables.length > 0)) {
        setSchema(data.schema);
      }
    } catch (error) {
      console.error('Error executing query:', error);
      setError(`Failed to execute query: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [graphService, fetchGraphData, isConnected, checkConnection]);

  // Expand a node to show its connections
  const expandNode = useCallback(async (
    node: GraphNode, 
    direction: 'INCOMING' | 'OUTGOING', 
    edgeLabel?: string
  ) => {
    if (!isConnected) {
      const connected = await checkConnection();
      if (!connected) {
        setError('Cannot expand node: Not connected to server');
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Find a key property for the node
      const keyPropName = node.key_property_names?.[0] || 'id';
      const keyPropValue = node.properties?.[keyPropName] || 
                          (node as any).identifier || // Cast to any to handle possible undefined
                          '';
      
      // Determine the property type based on the value
      // Default to STRING if we can't determine the type
      let propertyType = 'STRING';
      const value = node.properties?.[keyPropName];
      
      // Simple property type detection
      if (value !== undefined && value !== null) {
        if (typeof value === 'number') {
          if (Number.isInteger(value)) {
            propertyType = 'INT64';
          } else {
            propertyType = 'FLOAT64';
          }
        } else if (typeof value === 'boolean') {
          propertyType = 'BOOL';
        }
        // Keep STRING as default for all other types
      }
      
      console.log(`Expanding node with key property ${keyPropName}=${keyPropValue} (type: ${propertyType})`);
      
      const data = await graphService.expandNode({
        project: '',
        instance: '',
        database: '',
        node_key_property_name: keyPropName,
        node_key_property_value: keyPropValue.toString(),
        node_key_property_type: propertyType,
        graph: '',
        uid: (node as any).identifier || '', // Cast to any to handle possible undefined
        direction,
        edge_label: edgeLabel
      });
      
      // Merge the new nodes and edges with existing ones to avoid duplicates
      // Using a safe approach to access the identifier property
      const existingNodeIds = new Set(nodes.map(n => (n as any).identifier || ''));
      const newNodes = data.nodes.filter(n => !existingNodeIds.has((n as any).identifier || ''));
      
      const existingEdgeIds = new Set(edges.map(e => (e as any).identifier || ''));
      const newEdges = data.edges.filter(e => !existingEdgeIds.has((e as any).identifier || ''));
      
      if (newNodes.length > 0 || newEdges.length > 0) {
        setNodes(prev => [...prev, ...newNodes]);
        setEdges(prev => [...prev, ...newEdges]);
      }
    } catch (error) {
      console.error('Error expanding node:', error);
      setError(`Failed to expand node: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [graphService, nodes, edges, isConnected, checkConnection, setNodes, setEdges, setError, setLoading]);

  // Clear the current selection
  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Check connection when component mounts, but only once
  useEffect(() => {
    const checkConnectionOnMount = async () => {
      if (!connectionChecked.current) {
        await checkConnection();
      }
    };
    
    checkConnectionOnMount();
    // No dependencies to prevent re-runs
  }, []);

  // Create the context value object
  const value: GraphContextType = {
    nodes,
    edges,
    schema,
    loading,
    error,
    selectedNode,
    selectedEdge,
    setSelectedNode,
    setSelectedEdge,
    executeQuery,
    fetchGraphData,
    expandNode,
    clearSelection,
    isConnected,
    checkConnection
  };

  return (
    <GraphContext.Provider value={value}>
      {children}
    </GraphContext.Provider>
  );
};

// Custom hook to use the GraphContext
export const useGraph = () => useContext(GraphContext);

export default GraphContext; 