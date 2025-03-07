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

import { GraphNode, GraphEdge, GraphNodeParams, GraphEdgeParams, SchemaType } from '../models';
import { GraphData } from './GraphService';

// Sample node data
const sampleNodes: GraphNodeParams[] = [
  {
    labels: ['Person'],
    properties: {
      name: 'Alice',
      age: 30,
      occupation: 'Software Engineer'
    },
    key_property_names: ['name'],
    identifier: 'node1'
  },
  {
    labels: ['Person'],
    properties: {
      name: 'Bob',
      age: 28,
      occupation: 'Data Scientist'
    },
    key_property_names: ['name'],
    identifier: 'node2'
  },
  {
    labels: ['Company'],
    properties: {
      name: 'Google',
      founded: 1998,
      headquarters: 'Mountain View, CA'
    },
    key_property_names: ['name'],
    identifier: 'node3'
  },
  {
    labels: ['Company'],
    properties: {
      name: 'Microsoft',
      founded: 1975,
      headquarters: 'Redmond, WA'
    },
    key_property_names: ['name'],
    identifier: 'node4'
  },
  {
    labels: ['Project'],
    properties: {
      name: 'Project Alpha',
      budget: 1000000,
      status: 'In Progress'
    },
    key_property_names: ['name'],
    identifier: 'node5'
  }
];

// Sample edge data
const sampleEdges: GraphEdgeParams[] = [
  {
    labels: ['WORKS_AT'],
    properties: {
      since: 2015,
      role: 'Senior Engineer'
    },
    source_node_identifier: 'node1',
    destination_node_identifier: 'node3',
    identifier: 'edge1',
    key_property_names: ['role']
  },
  {
    labels: ['WORKS_AT'],
    properties: {
      since: 2018,
      role: 'Lead Data Scientist'
    },
    source_node_identifier: 'node2',
    destination_node_identifier: 'node4',
    identifier: 'edge2',
    key_property_names: ['role']
  },
  {
    labels: ['WORKS_ON'],
    properties: {
      role: 'Team Lead',
      hours_per_week: 30
    },
    source_node_identifier: 'node1',
    destination_node_identifier: 'node5',
    identifier: 'edge3',
    key_property_names: ['role']
  },
  {
    labels: ['WORKS_ON'],
    properties: {
      role: 'Contributor',
      hours_per_week: 20
    },
    source_node_identifier: 'node2',
    destination_node_identifier: 'node5',
    identifier: 'edge4',
    key_property_names: ['role']
  },
  {
    labels: ['FUNDS'],
    properties: {
      amount: 500000,
      approved_date: '2022-01-15'
    },
    source_node_identifier: 'node3',
    destination_node_identifier: 'node5',
    identifier: 'edge5',
    key_property_names: ['amount']
  }
];

// Sample schema data
const sampleSchema: SchemaType = {
  edgeTables: [
    {
      baseCatalogName: '',
      baseSchemaName: '',
      baseTableName: 'employment',
      destinationNodeTable: {
        edgeTableColumns: ['company_id'],
        nodeTableColumns: ['id'],
        nodeTableName: 'companies'
      },
      keyColumns: ['id'],
      kind: 'EDGE',
      labelNames: ['WORKS_AT'],
      name: 'employment',
      propertyDefinitions: [
        {
          propertyDeclarationName: 'since',
          valueExpressionSql: 'since',
          nodeTableName: ''
        },
        {
          propertyDeclarationName: 'role',
          valueExpressionSql: 'role',
          nodeTableName: ''
        }
      ],
      sourceNodeTable: {
        edgeTableColumns: ['person_id'],
        nodeTableColumns: ['id'],
        nodeTableName: 'people'
      }
    },
    {
      baseCatalogName: '',
      baseSchemaName: '',
      baseTableName: 'project_assignments',
      destinationNodeTable: {
        edgeTableColumns: ['project_id'],
        nodeTableColumns: ['id'],
        nodeTableName: 'projects'
      },
      keyColumns: ['id'],
      kind: 'EDGE',
      labelNames: ['WORKS_ON'],
      name: 'project_assignments',
      propertyDefinitions: [
        {
          propertyDeclarationName: 'role',
          valueExpressionSql: 'role',
          nodeTableName: ''
        },
        {
          propertyDeclarationName: 'hours_per_week',
          valueExpressionSql: 'hours_per_week',
          nodeTableName: ''
        }
      ],
      sourceNodeTable: {
        edgeTableColumns: ['person_id'],
        nodeTableColumns: ['id'],
        nodeTableName: 'people'
      }
    },
    {
      baseCatalogName: '',
      baseSchemaName: '',
      baseTableName: 'project_funding',
      destinationNodeTable: {
        edgeTableColumns: ['project_id'],
        nodeTableColumns: ['id'],
        nodeTableName: 'projects'
      },
      keyColumns: ['id'],
      kind: 'EDGE',
      labelNames: ['FUNDS'],
      name: 'project_funding',
      propertyDefinitions: [
        {
          propertyDeclarationName: 'amount',
          valueExpressionSql: 'amount',
          nodeTableName: ''
        },
        {
          propertyDeclarationName: 'approved_date',
          valueExpressionSql: 'approved_date',
          nodeTableName: ''
        }
      ],
      sourceNodeTable: {
        edgeTableColumns: ['company_id'],
        nodeTableColumns: ['id'],
        nodeTableName: 'companies'
      }
    }
  ],
  nodeTables: [
    {
      baseCatalogName: '',
      baseSchemaName: '',
      baseTableName: 'people',
      keyColumns: ['id'],
      kind: 'NODE',
      labelNames: ['Person'],
      name: 'people',
      propertyDefinitions: [
        {
          propertyDeclarationName: 'name',
          valueExpressionSql: 'name',
          nodeTableName: 'people'
        },
        {
          propertyDeclarationName: 'age',
          valueExpressionSql: 'age',
          nodeTableName: 'people'
        },
        {
          propertyDeclarationName: 'occupation',
          valueExpressionSql: 'occupation',
          nodeTableName: 'people'
        }
      ]
    },
    {
      baseCatalogName: '',
      baseSchemaName: '',
      baseTableName: 'companies',
      keyColumns: ['id'],
      kind: 'NODE',
      labelNames: ['Company'],
      name: 'companies',
      propertyDefinitions: [
        {
          propertyDeclarationName: 'name',
          valueExpressionSql: 'name',
          nodeTableName: 'companies'
        },
        {
          propertyDeclarationName: 'founded',
          valueExpressionSql: 'founded',
          nodeTableName: 'companies'
        },
        {
          propertyDeclarationName: 'headquarters',
          valueExpressionSql: 'headquarters',
          nodeTableName: 'companies'
        }
      ]
    },
    {
      baseCatalogName: '',
      baseSchemaName: '',
      baseTableName: 'projects',
      keyColumns: ['id'],
      kind: 'NODE',
      labelNames: ['Project'],
      name: 'projects',
      propertyDefinitions: [
        {
          propertyDeclarationName: 'name',
          valueExpressionSql: 'name',
          nodeTableName: 'projects'
        },
        {
          propertyDeclarationName: 'budget',
          valueExpressionSql: 'budget',
          nodeTableName: 'projects'
        },
        {
          propertyDeclarationName: 'status',
          valueExpressionSql: 'status',
          nodeTableName: 'projects'
        }
      ]
    }
  ]
};

/**
 * A mock implementation of the GraphService for testing
 */
class MockGraphService {
  /**
   * Fetch graph data from the mock service
   */
  async fetchGraphData(): Promise<GraphData> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const nodes = sampleNodes.map(nodeData => new GraphNode(nodeData));
    const edges = sampleEdges.map(edgeData => new GraphEdge(edgeData));
    
    return {
      nodes,
      edges,
      schema: sampleSchema
    };
  }

  /**
   * Execute a mock query
   */
  async executeQuery(query: string): Promise<GraphData> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo purposes, we'll return filtered results based on query keywords
    // In a real implementation, this would parse and execute the query
    const lowercaseQuery = query.toLowerCase();
    
    let filteredNodes = sampleNodes;
    let filteredEdges = sampleEdges;
    
    // Simple filtering based on query keywords
    if (lowercaseQuery.includes('person')) {
      filteredNodes = sampleNodes.filter(node => 
        node.labels.some(label => label.toLowerCase() === 'person')
      );
      filteredEdges = sampleEdges.filter(edge => 
        filteredNodes.some(node => 
          node.identifier === edge.source_node_identifier || 
          node.identifier === edge.destination_node_identifier
        )
      );
    } else if (lowercaseQuery.includes('company')) {
      filteredNodes = sampleNodes.filter(node => 
        node.labels.some(label => label.toLowerCase() === 'company')
      );
      filteredEdges = sampleEdges.filter(edge => 
        filteredNodes.some(node => 
          node.identifier === edge.source_node_identifier || 
          node.identifier === edge.destination_node_identifier
        )
      );
    } else if (lowercaseQuery.includes('project')) {
      filteredNodes = sampleNodes.filter(node => 
        node.labels.some(label => label.toLowerCase() === 'project')
      );
      filteredEdges = sampleEdges.filter(edge => 
        filteredNodes.some(node => 
          node.identifier === edge.source_node_identifier || 
          node.identifier === edge.destination_node_identifier
        )
      );
    } else if (lowercaseQuery.includes('works_at')) {
      filteredEdges = sampleEdges.filter(edge => 
        edge.labels.some(label => label.toLowerCase() === 'works_at')
      );
      filteredNodes = sampleNodes.filter(node => 
        filteredEdges.some(edge => 
          node.identifier === edge.source_node_identifier || 
          node.identifier === edge.destination_node_identifier
        )
      );
    }
    
    const nodes = filteredNodes.map(nodeData => new GraphNode(nodeData));
    const edges = filteredEdges.map(edgeData => new GraphEdge(edgeData));
    
    return {
      nodes,
      edges,
      schema: sampleSchema
    };
  }
}

export default MockGraphService; 