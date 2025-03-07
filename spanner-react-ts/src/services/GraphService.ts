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

import { GraphNode, GraphEdge, SchemaType } from '../models';

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  schema: SchemaType;
}

interface NodeExpansionParams {
  project: string;
  instance: string;
  database: string;
  node_key_property_name: string;
  node_key_property_value: string;
  node_key_property_type: string; // Required by the server
  graph: string;
  uid: string;
  direction: 'INCOMING' | 'OUTGOING';
  edge_label?: string;
}

export interface QueryParams {
  project: string;
  instance: string;
  database: string;
  graph: string;
  mock: boolean;
}

class GraphService {
  private serverUrl: string;
  private endpoints = {
    postQuery: '/post_query',
    postNodeExpansion: '/post_node_expansion',
    getPing: '/get_ping',
    postPing: '/post_ping'
  };
  
  constructor(port = 0) {
    // If port is passed, use it; otherwise try to get it from the window
    const serverPort = port || this.getServerPort();
    
    // Determine the host based on hostname
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Local environment
      this.serverUrl = `http://localhost:${serverPort}`;
    } else {
      // Assume JupyterLab or other proxy setup
      this.serverUrl = `/proxy/${serverPort}`;
    }
    
    console.log(`GraphService initialized with server URL: ${this.serverUrl}`);
  }

  /**
   * Try to get the server port from the window object
   * This is set by the server when using dev.html
   */
  private getServerPort(): number {
    if (typeof window !== 'undefined') {
      // Try different ways the port might be exposed
      if ((window as any).GRAPH_SERVER_PORT) {
        console.log(`Found GRAPH_SERVER_PORT in window: ${(window as any).GRAPH_SERVER_PORT}`);
        return (window as any).GRAPH_SERVER_PORT;
      }
      
      // Try to find a global variable that might have been injected
      const portMatch = document.body.innerHTML.match(/GRAPH_SERVER_PORT\s*=\s*(\d+)/);
      if (portMatch && portMatch[1]) {
        const port = parseInt(portMatch[1], 10);
        console.log(`Found GRAPH_SERVER_PORT in document: ${port}`);
        return port;
      }
    }
    
    // Default to the port used in graph_server.py
    console.log('Using default port for GraphServer');
    return 60638; // Use the same default port as in frontend/src/graph-server.js
  }

  /**
   * Ping the server to check connection
   */
  async ping(): Promise<boolean> {
    try {
      console.log(`Pinging server at ${this.serverUrl}${this.endpoints.getPing}`);
      const response = await fetch(`${this.serverUrl}${this.endpoints.getPing}`);
      const result = response.ok;
      console.log(`Ping result: ${result}`);
      return result;
    } catch (error) {
      console.error('Error pinging server:', error);
      return false;
    }
  }

  /**
   * Fetch graph data by executing an empty query
   * This essentially gets all data available
   */
  async fetchGraphData(): Promise<GraphData> {
    const defaultParams: QueryParams = {
      project: '',
      instance: '',
      database: '',
      graph: '',
      mock: true // Default to mock data for initial load
    };
    return this.executeQuery('', defaultParams);
  }

  /**
   * Execute a graph query and get results
   */
  async executeQuery(query: string, params: QueryParams): Promise<GraphData> {
    try {
      console.log('Executing query with params:', params);
      
      // Create the params object as expected by the server
      const paramsString = JSON.stringify({
        project: params.project,
        instance: params.instance,
        database: params.database,
        graph: params.graph,
        mock: params.mock
      });
      
      const requestBody = {
        query,
        params: paramsString
      };
      
      console.log(`Executing query: ${query}`);
      console.log(`Request URL: ${this.serverUrl}${this.endpoints.postQuery}`);
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${this.serverUrl}${this.endpoints.postQuery}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to execute query: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if the response is wrapped in a "response" object as in graph_server.py
      const responseData = data.response || data;
      
      console.log('Raw response data:', responseData);
      console.log('Nodes in response:', responseData.nodes?.length || 0);
      console.log('Edges in response:', responseData.edges?.length || 0);
      
      // Transform the raw data into our model classes
      const nodes = (responseData.nodes || []).map((nodeData: any) => new GraphNode({
        labels: nodeData.labels || [],
        properties: nodeData.properties || {},
        key_property_names: nodeData.key_property_names || [],
        identifier: nodeData.identifier || '',
        value: nodeData.value
      }));

      const edges = (responseData.edges || []).map((edgeData: any) => new GraphEdge({
        labels: edgeData.labels || [],
        properties: edgeData.properties || {},
        key_property_names: edgeData.key_property_names || [],
        identifier: edgeData.identifier || '',
        source_node_identifier: edgeData.source_node_identifier,
        destination_node_identifier: edgeData.destination_node_identifier
      }));
      
      console.log('Transformed nodes:', nodes.length);
      console.log('Transformed edges:', edges.length);
      
      // Debug: Check if nodes have uid property
      if (nodes.length > 0) {
        console.log('First node sample:', nodes[0]);
        console.log('Node has uid property:', nodes[0].hasOwnProperty('uid'));
      }
      
      // Debug: Check if edges have sourceUid and destinationUid properties
      if (edges.length > 0) {
        console.log('First edge sample:', edges[0]);
        console.log('Edge has sourceUid property:', edges[0].hasOwnProperty('sourceUid'));
        console.log('Edge has destinationUid property:', edges[0].hasOwnProperty('destinationUid'));
      }
      
      return {
        nodes,
        edges,
        schema: responseData.schema || { edgeTables: [], nodeTables: [] }
      };
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  /**
   * Expand a node to show its connections
   */
  async expandNode(params: NodeExpansionParams): Promise<GraphData> {
    try {
      console.log(`Expanding node: ${params.uid}`);
      console.log(`Request URL: ${this.serverUrl}${this.endpoints.postNodeExpansion}`);
      console.log('Request params:', params);
      
      const response = await fetch(`${this.serverUrl}${this.endpoints.postNodeExpansion}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to expand node: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if the response is wrapped in a "response" object as in graph_server.py
      const responseData = data.response || data;
      
      // Transform the raw data into our model classes
      const nodes = (responseData.nodes || []).map((nodeData: any) => new GraphNode({
        labels: nodeData.labels || [],
        properties: nodeData.properties || {},
        key_property_names: nodeData.key_property_names || [],
        identifier: nodeData.identifier || '',
        value: nodeData.value
      }));

      const edges = (responseData.edges || []).map((edgeData: any) => new GraphEdge({
        labels: edgeData.labels || [],
        properties: edgeData.properties || {},
        key_property_names: edgeData.key_property_names || [],
        identifier: edgeData.identifier || '',
        source_node_identifier: edgeData.source_node_identifier,
        destination_node_identifier: edgeData.destination_node_identifier
      }));
      
      return {
        nodes,
        edges,
        schema: responseData.schema || { edgeTables: [], nodeTables: [] }
      };
    } catch (error) {
      console.error('Error expanding node:', error);
      throw error;
    }
  }
}

export default GraphService; 