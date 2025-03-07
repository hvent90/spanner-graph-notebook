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

// Definition of node, edge, and schema types for graph data

export interface PropertyType {
  name: string;
  type: string;
}

export interface TableSchema {
  name: string;
  properties: PropertyType[];
}

export interface SchemaType {
  nodeTables: TableSchema[];
  edgeTables: TableSchema[];
}

export interface GraphElementProps {
  labels: string[];
  properties: Record<string, any>;
  key_property_names: string[];
  identifier: string;
  value?: any; // For specific payload content
}

export class GraphNode {
  labels: string[];
  properties: Record<string, any>;
  key_property_names: string[];
  identifier: string;
  value?: any;
  
  // For visualization purposes
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  index?: number;
  
  constructor(data: GraphElementProps) {
    this.labels = data.labels || [];
    this.properties = data.properties || {};
    this.key_property_names = data.key_property_names || [];
    this.identifier = data.identifier || '';
    this.value = data.value;
  }

  /**
   * Get a friendly display name for the node
   */
  getDisplayName(): string {
    // Try to use a known name property, or fallback to the first property value
    const nameOptions = ['name', 'title', 'id', 'identifier'];
    
    for (const option of nameOptions) {
      if (this.properties[option]) {
        return this.properties[option].toString();
      }
    }
    
    // If we have key property names, use the first one
    if (this.key_property_names.length > 0 && this.properties[this.key_property_names[0]]) {
      return this.properties[this.key_property_names[0]].toString();
    }
    
    // Otherwise use a generic name with the first label
    return this.labels.length > 0 
      ? `${this.labels[0]} node` 
      : `Node ${this.identifier.substring(0, 8)}`;
  }

  /**
   * Get primary label for the node
   */
  getPrimaryLabel(): string {
    return this.labels.length > 0 ? this.labels[0] : 'Node';
  }

  /**
   * Get primary key for the node
   */
  getPrimaryKey(): string {
    if (this.key_property_names.length > 0) {
      const keyName = this.key_property_names[0];
      return this.properties[keyName]?.toString() || '';
    }
    return this.identifier;
  }
}

export interface GraphEdgeProps extends GraphElementProps {
  source_node_identifier: string;
  destination_node_identifier: string;
}

export class GraphEdge {
  labels: string[];
  properties: Record<string, any>;
  key_property_names: string[];
  identifier: string;
  source_node_identifier: string;
  destination_node_identifier: string;
  value?: any;
  
  // For visualization purposes (D3 assigns these)
  source?: GraphNode;
  target?: GraphNode;
  index?: number;
  
  constructor(data: GraphEdgeProps) {
    this.labels = data.labels || [];
    this.properties = data.properties || {};
    this.key_property_names = data.key_property_names || [];
    this.identifier = data.identifier || '';
    this.source_node_identifier = data.source_node_identifier;
    this.destination_node_identifier = data.destination_node_identifier;
    this.value = data.value;
  }
  
  /**
   * Get a friendly display name for the edge
   */
  getDisplayName(): string {
    // Try to use the first label, or a generic name
    return this.labels.length > 0 
      ? this.labels[0].replace(/_/g, ' ') 
      : `Edge ${this.identifier.substring(0, 8)}`;
  }
  
  /**
   * Get primary label for the edge
   */
  getPrimaryLabel(): string {
    return this.labels.length > 0 ? this.labels[0] : 'Edge';
  }
  
  /**
   * Get primary key for the edge if available
   */
  getPrimaryKey(): string {
    if (this.key_property_names.length > 0) {
      const keyName = this.key_property_names[0];
      return this.properties[keyName]?.toString() || '';
    }
    return this.identifier;
  }
} 