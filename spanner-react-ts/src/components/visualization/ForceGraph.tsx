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

import React, { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'force-graph';
import { GraphNode, GraphEdge, Direction } from '../../models';
import { useGraph } from '../../contexts';
import styled from 'styled-components';
import * as d3 from 'd3';

const GraphContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="white" /><circle cx="50" cy="50" r="1" fill="rgba(0,0,0,0.2)" /></svg>');
  background-repeat: repeat;
`;

const ToolsContainer = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10;
`;

const ToolButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: white;
  border: 1px solid #dadce0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
    background-color: #f8f9fa;
  }
`;

const LabelToggleContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
  background-color: white;
  padding: 6px 12px;
  border-radius: 50px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
`;

const Toggle = styled.div<{ active: boolean }>`
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background-color: ${props => props.active ? '#1A73E8' : '#DADCE0'};
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
`;

const ToggleHandle = styled.div<{ active: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: white;
  position: absolute;
  top: 2px;
  left: ${props => props.active ? '18px' : '2px'};
  transition: left 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
`;

const ToggleLabel = styled.span`
  font-family: 'Google Sans', Roboto, Arial, sans-serif;
  font-size: 14px;
  color: #3C4043;
`;

interface ForceGraphProps {
  width?: number;
  height?: number;
}

// Layout modes enum to match the JavaScript implementation
enum LayoutModes {
  FORCE = 'FORCE',
  TOP_DOWN = 'TOP_DOWN',
  LEFT_RIGHT = 'LEFT_RIGHT',
  RADIAL_IN = 'RADIAL_IN',
  RADIAL_OUT = 'RADIAL_OUT',
}

// Edge design styles
const edgeDesign = {
  default: {
    color: '#DADCE0',
    width: 2,
    shadowWidth: 0,
    shadowColor: '#000000'
  },
  focused: {
    color: '#80868B',
    width: 3,
    shadowWidth: 6,
    shadowColor: '#E8EAED'
  },
  selected: {
    color: '#1A73E8',
    width: 4,
    shadowWidth: 8,
    shadowColor: 'rgba(26, 115, 232, 0.25)'
  }
};

// Color palette for nodes
const colorPalette = [
  '#1A73E8', '#E52592', '#12A4AF', '#F4511E',
  '#9334E6', '#689F38', '#3949AB', '#546E7A',
  '#EF6C00', '#D93025', '#1E8E3E', '#039BE5'
];

// Update the interface definitions
interface NodeObject extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
  val?: number;
  __lightened?: number;
}

interface LinkObject extends Omit<GraphEdge, 'curvature'> {
  source: NodeObject;
  target: NodeObject;
  curvature?: {
    nodePairId: string;
    amount: number;
  };
  // Add these properties that were in the original implementation
  type?: string;
  label?: string;
}

const ForceGraph: React.FC<ForceGraphProps> = ({ width = 800, height = 600 }) => {
  const graphRef = useRef<HTMLDivElement>(null);
  const graphInstance = useRef<any>(null);
  const { 
    nodes, 
    edges, 
    setSelectedNode, 
    setSelectedEdge, 
    selectedNode, 
    selectedEdge,
    expandNode
  } = useGraph();
  
  // State for graph visualization
  const [focusedNode, setFocusedNode] = useState<GraphNode | null>(null);
  const [focusedEdge, setFocusedEdge] = useState<GraphEdge | null>(null);
  const [selectedNodeEdges, setSelectedNodeEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeNeighbors, setSelectedNodeNeighbors] = useState<GraphNode[]>([]);
  const [focusedNodeEdges, setFocusedNodeEdges] = useState<GraphEdge[]>([]);
  const [focusedNodeNeighbors, setFocusedNodeNeighbors] = useState<GraphNode[]>([]);
  const [selectedEdgeNeighbors, setSelectedEdgeNeighbors] = useState<GraphNode[]>([]);
  const [focusedEdgeNeighbors, setFocusedEdgeNeighbors] = useState<GraphNode[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutModes>(LayoutModes.FORCE);
  const [requestedRecenter, setRequestedRecenter] = useState<boolean>(false);
  const [nodeColors, setNodeColors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(false);
  // Add a ref to track the previous nodes and edges for comparison
  const previousDataRef = useRef<{ nodes: GraphNode[], edges: GraphEdge[] }>({ nodes: [], edges: [] });
  
  // Type guards for GraphNode and GraphEdge
  const isGraphNode = (obj: any): obj is GraphNode => {
    return obj && typeof obj === 'object' && 'uid' in obj;
  };
  
  const isGraphEdge = (obj: any): obj is GraphEdge => {
    return obj && typeof obj === 'object' && 'sourceUid' in obj && 'destinationUid' in obj;
  };
  
  // Compute curvature for edges to handle multiple edges between the same nodes
  const computeCurvature = useCallback((links: GraphEdge[]) => {
    const linksByNodePair: Record<string, GraphEdge[]> = {};
    
    links.forEach(link => {
      const source = link.sourceUid;
      const target = link.destinationUid;
      const nodePairId = source < target ? `${source}-${target}` : `${target}-${source}`;
      
      if (!linksByNodePair[nodePairId]) {
        linksByNodePair[nodePairId] = [];
      }
      
      link.curvature = {
        nodePairId,
        amount: 0
      };
      
      linksByNodePair[nodePairId].push(link);
    });
    
    // Calculate curvature for edges between the same node pairs
    Object.entries(linksByNodePair).forEach(([nodePairId, pairLinks]) => {
      if (pairLinks.length > 1) {
        const maxCurvature = 0.3;
        const curvatureStep = maxCurvature / (pairLinks.length - 1);
        
        pairLinks.forEach((link, i) => {
          // Start with negative curvature and move to positive
          const curvature = -maxCurvature / 2 + i * curvatureStep;
          link.curvature.amount = curvature;
        });
      }
    });
    
    return links;
  }, []);
  
  // Replace the getDisplayName function with one that matches the original
  const getDisplayName = useCallback((element: any): string => {
    // Use labels and id format matching original implementation
    if (element && Array.isArray(element.labels) && element.labels.length > 0) {
      // If it has an id property, show label + id in parens
      if (element.uid) {
        return `${element.labels[0]} (${element.uid})`;
      }
      return element.labels[0];
    }
    
    // Fallback for edges - use type if available
    if (element && element.type) {
      return element.type;
    }
    
    // Last resort
    return element?.uid ? `Node ${element.uid}` : 'Unknown';
  }, []);
  
  // Replace the getColorForNode function to match the original implementation
  const getColorForNode = useCallback((node: GraphNode) => {
    // Assign colors based on the first label (node type)
    if (Array.isArray(node.labels) && node.labels.length > 0) {
      const label = node.labels[0];
      
      // Define specific colors for common node types
      if (label.toLowerCase().includes('account')) {
        return '#E52592'; // Pink for Account nodes
      } else if (label.toLowerCase().includes('person')) {
        return '#1A73E8'; // Blue for Person nodes
      }
      
      // For other node types, use the nodeColors map
      if (nodeColors[label]) {
        return nodeColors[label];
      }
    }
    
    // Default color
    return '#808080';
  }, [nodeColors]);
  
  // Lighten a color by a specified amount
  const lightenColor = useCallback((color: string, amount: number) => {
    const hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.min(255, Math.round(r + (255 - r) * amount));
    g = Math.min(255, Math.round(g + (255 - g) * amount));
    b = Math.min(255, Math.round(b + (255 - b) * amount));

    return `rgb(${r}, ${g}, ${b})`;
  }, []);
  
  // Update related nodes and edges when selection changes
  const refreshCache = useCallback(() => {
    if (!graphInstance.current) return;
    
    // Update related nodes and edges for selection
    if (selectedNode) {
      const nodeEdges = edges.filter(edge => 
        edge.sourceUid === selectedNode.uid || edge.destinationUid === selectedNode.uid
      );
      setSelectedNodeEdges(nodeEdges);
      
      const nodeNeighbors = nodes.filter(node => 
        node.uid !== selectedNode.uid && 
        nodeEdges.some(edge => 
          edge.sourceUid === node.uid || edge.destinationUid === node.uid
        )
      );
      setSelectedNodeNeighbors(nodeNeighbors);
    } else {
      setSelectedNodeEdges([]);
      setSelectedNodeNeighbors([]);
    }
    
    // Update related nodes and edges for focus
    if (focusedNode) {
      const nodeEdges = edges.filter(edge => 
        edge.sourceUid === focusedNode.uid || edge.destinationUid === focusedNode.uid
      );
      setFocusedNodeEdges(nodeEdges);
      
      const nodeNeighbors = nodes.filter(node => 
        node.uid !== focusedNode.uid && 
        nodeEdges.some(edge => 
          edge.sourceUid === node.uid || edge.destinationUid === node.uid
        )
      );
      setFocusedNodeNeighbors(nodeNeighbors);
    } else {
      setFocusedNodeEdges([]);
      setFocusedNodeNeighbors([]);
    }
    
    // Update related nodes for edge selection
    if (selectedEdge) {
      const edgeNodes = nodes.filter(node => 
        node.uid === selectedEdge.sourceUid || node.uid === selectedEdge.destinationUid
      );
      setSelectedEdgeNeighbors(edgeNodes);
    } else {
      setSelectedEdgeNeighbors([]);
    }
    
    // Update related nodes for edge focus
    if (focusedEdge) {
      const edgeNodes = nodes.filter(node => 
        node.uid === focusedEdge.sourceUid || node.uid === focusedEdge.destinationUid
      );
      setFocusedEdgeNeighbors(edgeNodes);
    } else {
      setFocusedEdgeNeighbors([]);
    }
  }, [edges, focusedEdge, focusedNode, nodes, selectedEdge, selectedNode]);
  
  // Update the updateGraphData function to ensure it's properly debugging
  const updateGraphData = useCallback(() => {
    if (!graphInstance.current) {
      console.error('Cannot update graph data: graph instance is null');
      return;
    }
    
    console.log('Updating graph data:', { 
      nodes: nodes.length > 0 ? `${nodes.length} nodes` : 'No nodes', 
      edges: edges.length > 0 ? `${edges.length} edges` : 'No edges',
      nodesFirstItem: nodes.length > 0 ? JSON.stringify(nodes[0]) : 'No nodes',
      edgesExample: edges.length > 0 ? JSON.stringify(edges[0]) : 'No edges'
    });
    
    // Check if nodes have the required uid property
    const validNodes = nodes.filter(node => node.uid !== undefined);
    if (validNodes.length !== nodes.length) {
      console.warn(`Found ${nodes.length - validNodes.length} nodes without uid property. These will be filtered out.`);
    }
    
    // Check if edges have the required sourceUid and destinationUid properties
    const validEdges = edges.filter(edge => edge.sourceUid !== undefined && edge.destinationUid !== undefined);
    if (validEdges.length !== edges.length) {
      console.warn(`Found ${edges.length - validEdges.length} edges without sourceUid or destinationUid properties. These will be filtered out.`);
    }
    
    console.log('Valid nodes and edges to render:', {
      validNodesCount: validNodes.length,
      validEdgesCount: validEdges.length
    });
    
    // Process edges to add curvature
    const processedEdges = computeCurvature(validEdges);
    
    // Create a color mapping for node types that aren't explicitly handled
    const labelColorMap: Record<string, string> = {};
    const availableColors = [...colorPalette];
    
    validNodes.forEach(node => {
      if (Array.isArray(node.labels) && node.labels.length > 0) {
        const label = node.labels[0];
        // Skip if it's a common type we already handle or if we've already assigned a color
        if (
          !label.toLowerCase().includes('account') && 
          !label.toLowerCase().includes('person') && 
          !labelColorMap[label] && 
          availableColors.length > 0
        ) {
          labelColorMap[label] = availableColors.shift() || '#808080';
        }
      }
    });
    
    // Update the nodeColors state
    setNodeColors(labelColorMap);
    
    try {
      // Check if this is an initial load or significant change in node count
      const isInitialLoad = !previousDataRef.current.nodes.length && validNodes.length > 0;
      const isSignificantChange = Math.abs(previousDataRef.current.nodes.length - validNodes.length) > 5;
      
      // Update the graph data
      graphInstance.current.graphData({ 
        nodes: validNodes.map(node => ({
          ...node,
          // Clear positions for new nodes
          ...(node.x === undefined && {
            x: undefined,
            y: undefined,
            fx: undefined,
            fy: undefined,
            vx: undefined,
            vy: undefined
          })
        })), 
        links: processedEdges.map(edge => {
          // Ensure the edge has the correct source and target format
          // Force-graph expects 'source' and 'target' to be the node objects or node IDs
          return {
            ...edge,
            source: edge.sourceUid,
            target: edge.destinationUid
          };
        })
      });
      
      // Verify graph data was updated
      const currentGraphData = graphInstance.current.graphData();
      console.log('Graph data after update:', {
        graphNodesCount: currentGraphData.nodes.length,
        graphLinksCount: currentGraphData.links.length
      });
      
      // Only recenter if it's the initial load or there's a significant change in node count
      if (isInitialLoad || isSignificantChange) {
        console.log('Requesting recenter due to initial load or significant change');
        setRequestedRecenter(true);
        
        // Force zoom to fit immediately for better user experience
        try {
          if (graphInstance.current && typeof graphInstance.current.zoomToFit === 'function') {
            graphInstance.current.zoomToFit(400, 50);
          } else {
            console.warn('zoomToFit is not available on the graph instance');
          }
        } catch (error) {
          console.error('Error during zoomToFit:', error);
        }
      }
    } catch (error) {
      console.error('Error updating graph data:', error);
    }
    
    // Refresh cache to update relationships
    refreshCache();
    
    // Update the previous data reference - create a deep copy to avoid reference issues
    previousDataRef.current = { 
      nodes: JSON.parse(JSON.stringify(nodes)) as GraphNode[], 
      edges: JSON.parse(JSON.stringify(edges)) as GraphEdge[]
    };
  }, [nodes, edges, computeCurvature, refreshCache, colorPalette]);
  
  // Handle layout mode changes
  const handleLayoutModeChange = useCallback((newLayoutMode: LayoutModes) => {
    if (!graphInstance.current) return;
    
    // Only update if the layout mode has actually changed
    if (newLayoutMode === layoutMode) {
      console.log('Layout mode unchanged, skipping update');
      return;
    }
    
    console.log(`Changing layout mode from ${layoutMode} to ${newLayoutMode}`);
    setLayoutMode(newLayoutMode);
    let dagDistance;
    let collisionRadius = 1; // Default collision radius
    let forceGraphLayoutModeString = '';
    
    const graphSize = Math.max(nodes.length, 15);
    
    switch (newLayoutMode) {
      case LayoutModes.FORCE:
        dagDistance = 0; // Not applicable for force layout
        break;
      case LayoutModes.TOP_DOWN:
        forceGraphLayoutModeString = 'td';
        dagDistance = Math.log10(graphSize) * 50;
        collisionRadius = 12;
        break;
      case LayoutModes.LEFT_RIGHT:
        forceGraphLayoutModeString = 'lr';
        dagDistance = Math.log10(graphSize) * 100;
        collisionRadius = 12;
        break;
      case LayoutModes.RADIAL_IN:
        forceGraphLayoutModeString = 'radialin';
        dagDistance = Math.log10(graphSize) * 100;
        collisionRadius = 8;
        break;
      case LayoutModes.RADIAL_OUT:
        forceGraphLayoutModeString = 'radialout';
        dagDistance = Math.log10(graphSize) * 100;
        collisionRadius = 8;
        break;
    }
    
    graphInstance.current.dagMode(forceGraphLayoutModeString);
    graphInstance.current.dagLevelDistance(dagDistance);
    
    // Update d3Force collision
    setRequestedRecenter(true);
    graphInstance.current.d3Force('collide', d3.forceCollide(collisionRadius));
  }, [nodes.length, layoutMode]);
  
  // Get edge design based on selection state
  const getEdgeDesign = useCallback((edge: any) => {
    if (!isGraphEdge(edge)) return edgeDesign.default;
    
    if (selectedEdge && edge.uid === selectedEdge.uid) {
      return edgeDesign.selected;
    }
    
    if (selectedNode) {
      if (edge.sourceUid === selectedNode.uid || edge.destinationUid === selectedNode.uid) {
        return edgeDesign.focused;
      }
      return edgeDesign.default;
    }
    
    if (focusedEdge && edge.uid === focusedEdge.uid) {
      return edgeDesign.focused;
    }
    
    if (focusedNode) {
      if (edge.sourceUid === focusedNode.uid || edge.destinationUid === focusedNode.uid) {
        return edgeDesign.focused;
      }
    }
    
    return edgeDesign.default;
  }, [selectedEdge, selectedNode, focusedEdge, focusedNode, isGraphEdge]);
  
  // Generate tooltip content for a graph element
  const generateTooltip = useCallback((element: any) => {
    let color = "#a9a9a9";
    if (isGraphNode(element)) {
      color = getColorForNode(element);
    }
    
    let content = `
      <div style="background-color: ${color}; padding: 8px; border-radius: 4px; color: white;">
        <div><strong>${getDisplayName(element)}</strong></div>`;
    
    if (element.properties && Array.isArray(element.key_property_names)) {
      if (element.key_property_names.length === 1) {
        const key = element.key_property_names[0];
        if (element.properties.hasOwnProperty(key)) {
          content += `<div>${element.properties[key]}</div>`;
        }
      } else {
        for (const key of element.key_property_names) {
          if (element.properties.hasOwnProperty(key)) {
            content += `<div>${key}: ${element.properties[key]}</div>`;
          }
        }
      }
    }
    
    content += '</div>';
    return content;
  }, [getColorForNode, getDisplayName, isGraphNode]);
  
  // Handle node expansion
  const handleNodeExpansion = useCallback((node: GraphNode, direction: Direction, edgeLabel?: string) => {
    // Call the expandNode function from the context
    expandNode(node, direction, edgeLabel);
    
    // After expansion, we need to update the graph data
    // This will be triggered by the useEffect below when nodes/edges change
  }, [expandNode]);
  
  // Show context menu for a node
  const showNodeContextMenu = useCallback((node: GraphNode, event: MouseEvent) => {
    // This would be implemented to show a context menu with options like expand node
    console.log('Context menu for node:', node);
    
    // For now, let's just expand the node in both directions as an example
    handleNodeExpansion(node, 'OUTGOING' as Direction);
  }, [handleNodeExpansion]);
  
  // Add this at the beginning of the component to log props
  useEffect(() => {
    console.log('ForceGraph component data:', { 
      nodesCount: nodes.length, 
      edgesCount: edges.length,
      nodesExample: nodes.length > 0 ? nodes[0] : null,
      edgesExample: edges.length > 0 ? edges[0] : null
    });
  }, [nodes, edges]);

  // Update the effect to ensure it runs when data is available
  useEffect(() => {
    if (!graphRef.current) return;
    
    // Only log during initial setup or when nodes/edges change significantly
    if (!isInitialized || previousDataRef.current.nodes.length !== nodes.length || 
        previousDataRef.current.edges.length !== edges.length) {
      console.log('Initializing or updating force graph', { 
        isInitialized, 
        nodesLength: nodes.length, 
        edgesLength: edges.length 
      });
    }
    
    if (!isInitialized) {
      console.log('Creating new ForceGraph2D instance');
      
      // Create the ForceGraph2D instance only once
      // @ts-ignore - ForceGraph2D is a function that returns a function
      graphInstance.current = ForceGraph2D()(graphRef.current)
        .width(width)
        .height(height)
        .nodeId('uid')
        .nodeRelSize(6) // Make nodes more visible
        // Explicitly enable zoom/pan interactions
        .enableZoomInteraction(true)
        .enablePanInteraction(true)
        .enableNodeDrag(true)
        .minZoom(0.1)
        .maxZoom(10)
        // Add custom zoom handler
        .onZoom((transform: { k: number, x: number, y: number }) => {
          console.log('Zoom event:', transform);
          // This ensures the zoom event is properly processed
        })
        // Use the correct method for node dragging
        .nodeVal((node: any) => {
          if (!isGraphNode(node)) return 1;
          
          // Make selected or focused nodes appear larger
          if (selectedNode?.uid === node.uid) {
            return 1.5; // Selected node is larger
          }
          
          if (focusedNode?.uid === node.uid) {
            return 1.3; // Focused node is slightly larger
          }
          
          // Make connected nodes to selected/focused nodes slightly larger
          if (
            selectedNodeNeighbors.some(n => n.uid === node.uid) ||
            focusedNodeNeighbors.some(n => n.uid === node.uid) ||
            selectedEdgeNeighbors.some(n => n.uid === node.uid) ||
            focusedEdgeNeighbors.some(n => n.uid === node.uid)
          ) {
            return 1.2;
          }
          
          return 1;
        })
        .nodeLabel((node: any) => generateTooltip(node))
        .nodeColor((node: any) => {
          if (!isGraphNode(node)) return '#808080';
          
          const n = node;
          
          // Direct color return for selected/focused nodes
          if (selectedNode && n.uid === selectedNode.uid) {
            return getColorForNode(n); // Full color for selected
          }
          
          if (focusedNode && n.uid === focusedNode.uid) {
            return getColorForNode(n); // Full color for focused
          }
          
          // Handle connected nodes
          if (selectedNode || focusedNode) {
            const isConnected = 
              selectedNodeNeighbors.some(neighbor => neighbor.uid === n.uid) ||
              focusedNodeNeighbors.some(neighbor => neighbor.uid === n.uid) ||
              selectedEdgeNeighbors.some(neighbor => neighbor.uid === n.uid) ||
              focusedEdgeNeighbors.some(neighbor => neighbor.uid === n.uid);
            
            if (isConnected) {
              return getColorForNode(n); // Full color for connected
            }
            
            // Lighten other nodes
            return lightenColor(getColorForNode(n), 0.6);
          }
          
          // Normal state - no selection
          return getColorForNode(n);
        })
        .linkSource('sourceUid')
        .linkTarget('destinationUid')
        .linkLabel((link: any) => generateTooltip(link))
        .linkCurvature((link: any) => (link.curvature && link.curvature.amount) || 0)
        // Fix edge colors
        .linkColor((link: any) => {
          if (!isGraphEdge(link)) return edgeDesign.default.color;
          
          // Check if ANY node OR edge is focused or selected
          const isAnyElementFocusedOrSelected = 
            focusedNode !== null || 
            selectedNode !== null || 
            focusedEdge !== null || 
            selectedEdge !== null;
          
          // Check if this edge is connected to focused or selected nodes
          const isConnectedToFocusedNode = focusedNode && 
            (link.sourceUid === focusedNode.uid || link.destinationUid === focusedNode.uid);
          
          const isConnectedToSelectedNode = selectedNode && 
            (link.sourceUid === selectedNode.uid || link.destinationUid === selectedNode.uid);
          
          // Lighten the edge color if an element is focused or selected
          // and the edge is NOT connected to it
          if (isAnyElementFocusedOrSelected &&
              !isConnectedToFocusedNode &&
              !isConnectedToSelectedNode &&
              link !== focusedEdge && 
              link !== selectedEdge) {
            
            const lightenAmount = 0.48;
            return lightenColor(edgeDesign.default.color, lightenAmount);
          }
          
          // Set color based on selection state
          if (selectedEdge && link.uid === selectedEdge.uid) {
            return edgeDesign.selected.color;
          }
          
          if (focusedEdge && link.uid === focusedEdge.uid) {
            return edgeDesign.focused.color;
          }
          
          // Highlight edges connected to selected node
          if (selectedNode) {
            if (link.sourceUid === selectedNode.uid || link.destinationUid === selectedNode.uid) {
              return edgeDesign.focused.color;
            }
          }
          
          // Highlight edges connected to focused node
          if (focusedNode) {
            if (link.sourceUid === focusedNode.uid || link.destinationUid === focusedNode.uid) {
              return edgeDesign.focused.color;
            }
          }
          
          return edgeDesign.default.color;
        })
        // Fix edge width
        .linkWidth((link: any) => {
          if (!isGraphEdge(link)) return edgeDesign.default.width;
          
          // Set width based on selection state
          if (selectedEdge && link.uid === selectedEdge.uid) {
            return edgeDesign.selected.width;
          }
          
          if (focusedEdge && link.uid === focusedEdge.uid) {
            return edgeDesign.focused.width;
          }
          
          // Highlight edges connected to selected node
          if (selectedNode) {
            if (link.sourceUid === selectedNode.uid || link.destinationUid === selectedNode.uid) {
              return edgeDesign.focused.width;
            }
          }
          
          // Highlight edges connected to focused node
          if (focusedNode) {
            if (link.sourceUid === focusedNode.uid || link.destinationUid === focusedNode.uid) {
              return edgeDesign.focused.width;
            }
          }
          
          return edgeDesign.default.width;
        })
        // Add these critical configurations for edge visibility
        .linkVisibility(true)
        .linkDirectionalParticles((link: any) => {
          if (!isGraphEdge(link)) return 0;
          
          // Add particles to selected or focused edges for emphasis
          if (selectedEdge && link.uid === selectedEdge.uid) {
            return 4;
          }
          
          if (focusedEdge && link.uid === focusedEdge.uid) {
            return 2;
          }
          
          return 0;
        })
        .linkDirectionalParticleWidth(2)
        .linkDirectionalParticleSpeed(0.005)
        .linkDirectionalArrowLength(4) // Match original implementation
        .linkDirectionalArrowRelPos(0.9875) // Match original implementation
        // Add custom edge rendering to ensure edges are visible
        .linkCanvasObjectMode(() => 'after')
        .linkCanvasObject((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          if (!isGraphEdge(link)) return;
          
          // Check if source and target objects exist
          if (!link.source || !link.target) {
            console.warn('Link missing source or target object:', link);
            return;
          }
          
          const isSelected = selectedEdge && link.uid === selectedEdge.uid;
          const isFocused = focusedEdge && link.uid === focusedEdge.uid;
          
          // Implement showLabel logic similar to original
          const showLabel = () => {
            // 1. Prioritize focused edge
            if (focusedEdge && link === focusedEdge) {
              return true; // Always show label for focused edge
            }
            
            // 2. Show label if a node is connected to a focused or selected node
            if ((selectedNode && (link.sourceUid === selectedNode.uid || link.destinationUid === selectedNode.uid)) ||
                (focusedNode && (link.sourceUid === focusedNode.uid || link.destinationUid === focusedNode.uid))) {
              return true;
            }
            
            // 3. Show label if the edge is selected
            if (selectedEdge && link === selectedEdge) {
              return true; // Always show label for selected edge
            }
            
            // 4. Show labels if within zoom tolerance and no node or edge is focused/selected
            const focusedOrSelectedObjectExists = focusedEdge || selectedEdge || focusedNode || selectedNode;
            const withinZoomTolerance = globalScale > 0.6; // Equivalent to maxGlobalScale
            if (withinZoomTolerance && !focusedOrSelectedObjectExists) {
              return true;
            }
            
            // 5. Always show the label if "Show Labels" is selected
            if (showLabels) {
              return true;
            }
            
            // Otherwise, hide the label
            return false;
          };
          
          if (!showLabel()) {
            return;
          }
          
          // Get source and target coordinates with additional safety checks
          const start = { 
            x: typeof link.source.x === 'number' ? link.source.x : 0, 
            y: typeof link.source.y === 'number' ? link.source.y : 0 
          };
          const end = { 
            x: typeof link.target.x === 'number' ? link.target.x : 0, 
            y: typeof link.target.y === 'number' ? link.target.y : 0 
          };
          
          if (isNaN(start.x) || isNaN(start.y) || isNaN(end.x) || isNaN(end.y)) return;
          
          // Initialize text position at midpoint
          let textPos = {
            x: (start.x + end.x) * 0.5,
            y: (start.y + end.y) * 0.5
          };
          
          // Get edge label - using same logic from original implementation
          let label = '';
          if (link.labels && link.labels.length > 0) {
            label = link.labels[0];
          } else if ((link as any).type) {
            label = (link as any).type;
          } else if ((link as any).label) {
            label = (link as any).label;
          }
          
          if (!label) return; // Skip if no label
          
          // Handle curved edges
          const curvature = (link.curvature && link.curvature.amount) || 0;
          const selfLoop = link.sourceUid === link.destinationUid;
          
          if (Math.abs(curvature) > 0.001) {
            // Handle curved edges
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            
            // Control point for quadratic curve
            const cpX = start.x + dx / 2 - curvature * dy;
            const cpY = start.y + dy / 2 + curvature * dx;
            
            // Get the point at 50% along the quadratic curve
            const t = 0.5;
            textPos.x = Math.pow(1-t, 2) * start.x + 2 * (1-t) * t * cpX + Math.pow(t, 2) * end.x;
            textPos.y = Math.pow(1-t, 2) * start.y + 2 * (1-t) * t * cpY + Math.pow(t, 2) * end.y;
          }
          
          // Calculate text angle
          let textAngle = Math.atan2(end.y - start.y, end.x - start.x);
          if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
          if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);
          
          // Calculate max text length based on link length
          let labelTail = '';
          let maxTextLength = 50;
          
          if (!selfLoop) {
            const relLink = {x: end.x - start.x, y: end.y - start.y};
            const linkLength = Math.sqrt(relLink.x * relLink.x + relLink.y * relLink.y);
            maxTextLength = linkLength - 5;
          }
          
          // Set font size and style
          const fontSize = 2;
          const defaultTextStyle = 'normal';
          const highlightedTextStyle = 'bold';
          
          ctx.font = `${isFocused || isSelected ? highlightedTextStyle : defaultTextStyle} ${fontSize}px 'Google Sans', Roboto, Arial, sans-serif`;
          
          // Truncate text if too long
          const getTextWidth = () => (ctx.measureText(label).width + ctx.measureText(labelTail).width) * 2;
          while (getTextWidth() > maxTextLength) {
            if (label.length <= 1) {
              break;
            }
            
            label = label.substring(0, label.length - 1);
            labelTail = '...';
          }
          
          label = label + labelTail;
          const textRect = ctx.measureText(label);
          
          // Save context for rotation
          ctx.save();
          ctx.translate(textPos.x, textPos.y);
          ctx.rotate(textAngle);
          
          // Draw label background
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.fillRect(
            (-textRect.width / 2) - 1,
            (-fontSize / 2) - 1,
            textRect.width + 2,
            fontSize + 2
          );
          
          // Set text colors based on selection state
          const defaultTextColor = '#9AA0A6';
          const focusedTextColor = '#3C4043';
          const selectedTextColor = '#1A73E8';
          
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Handle text vertical offset for different browsers
          let textVerticalOffset = 0;
          if (navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1) {
            textVerticalOffset = -Math.abs(
              (textRect as any).actualBoundingBoxAscent - (textRect as any).actualBoundingBoxDescent
            ) * 0.25;
          } else {
            textVerticalOffset = (ctx.measureText("H") as any).actualBoundingBoxDescent * 0.5;
          }
          
          // Fill text with appropriate color
          ctx.fillStyle = isSelected
            ? selectedTextColor
            : isFocused
              ? focusedTextColor
              : defaultTextColor;
          
          ctx.fillText(label, 0, textVerticalOffset);
          
          // Draw border around text
          ctx.strokeStyle = isSelected
            ? selectedTextColor
            : defaultTextColor;
          
          ctx.lineWidth = 0.5;
          ctx.strokeRect(
            (-textRect.width / 2) - 1,
            (-fontSize / 2) - 1,
            textRect.width + 2,
            fontSize + 2
          );
          
          // Restore context
          ctx.restore();
        })
        .onNodeHover((node: any) => {
          // Don't update if the focused node hasn't changed to prevent re-renders
          if (node?.uid === focusedNode?.uid || (!node && !focusedNode)) return;
          setFocusedNode(node as GraphNode | null);
        })
        .onNodeClick((node: any, event: any) => {
          // Check if Ctrl key (Windows/Linux) or Cmd key (Mac) is pressed
          if (event.ctrlKey || event.metaKey) {
            showNodeContextMenu(node as GraphNode, event);
          } else {
            console.log('Node clicked:', node);
            setSelectedNode(node as GraphNode);
            setSelectedEdge(null);
          }
        })
        .onNodeRightClick((node: any, event: any) => {
          showNodeContextMenu(node as GraphNode, event);
        })
        .onNodeDragEnd((node: any) => {
          // Fix node position after drag
          node.fx = node.x;
          node.fy = node.y;
        })
        .onLinkHover((link: any) => {
          // Don't update if the focused edge hasn't changed to prevent re-renders
          if (link?.uid === focusedEdge?.uid || (!link && !focusedEdge)) return;
          setFocusedEdge(link as GraphEdge | null);
        })
        .onLinkClick((link: any) => {
          console.log('Edge clicked:', link);
          setSelectedEdge(link as GraphEdge);
          setSelectedNode(null);
        })
        .onBackgroundClick(() => {
          setSelectedNode(null);
          setSelectedEdge(null);
        })
        .onEngineStop(() => {
          // Only perform automatic zoom if explicitly requested
          // This ensures we don't interfere with manual zooming/panning
          if (requestedRecenter) {
            console.log('Engine stopped with requestedRecenter=true, performing zoom to fit');
            try {
              if (graphInstance.current && typeof graphInstance.current.zoomToFit === 'function') {
                graphInstance.current.zoomToFit(1000, 100);
              } else {
                console.warn('zoomToFit is not available on the graph instance');
              }
            } catch (error) {
              console.error('Error during zoomToFit in onEngineStop:', error);
            } finally {
              setRequestedRecenter(false);
            }
          } else {
            console.log('Engine stopped but no recenter requested, preserving manual zoom/pan');
          }
        })
        .cooldownTime(1250)
        // Improved node rendering - closer to original implementation
        .nodeCanvasObject((node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
          if (!isGraphNode(node)) return;
          
          const nodeColor = getColorForNode(node);
          const x = node.x || 0;
          const y = node.y || 0;
          const size = (node.val || 1) * 4; // Base node size
          
          // Draw outer highlight for selected/focused/connected nodes
          if (
            (selectedNode && node.uid === selectedNode.uid) || 
            (focusedNode && node.uid === focusedNode.uid) ||
            selectedNodeNeighbors.some(n => n.uid === node.uid) ||
            focusedNodeNeighbors.some(n => n.uid === node.uid) ||
            selectedEdgeNeighbors.some(n => n.uid === node.uid) ||
            focusedEdgeNeighbors.some(n => n.uid === node.uid)
          ) {
            // Draw highlight ring
            ctx.beginPath();
            ctx.arc(x, y, size + 3/globalScale, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
          }
          
          // Draw node circle
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fillStyle = nodeColor;
          ctx.fill();
          
          // Add white border to nodes
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5 / globalScale;
          ctx.stroke();
          
          // Draw node label if showLabels is true or node is selected/focused
          const shouldShowLabel = showLabels || 
            node.uid === selectedNode?.uid || 
            node.uid === focusedNode?.uid;
            
          if (shouldShowLabel) {
            const label = getDisplayName(node);
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px 'Google Sans', Roboto, Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw label text with white outline for better readability
            ctx.fillStyle = '#fff';
            ctx.fillText(label, x, y + size + fontSize);
          }
        })
        // Update edge label rendering to match original
        .linkCanvasObject((link: LinkObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
          if (!isGraphEdge(link)) return;
          
          // Check if source and target objects exist
          if (!link.source || !link.target) {
            console.warn('Link missing source or target object:', link);
            return;
          }
          
          const isSelected = link === selectedEdge;
          const isFocused = link === focusedEdge;
          
          // Implement showLabel logic similar to original
          const showLabel = () => {
            // 1. Prioritize focused edge
            if (focusedEdge && link === focusedEdge) {
              return true; // Always show label for focused edge
            }
            
            // 2. Show label if a node is connected to a focused or selected node
            if ((selectedNode && (link.sourceUid === selectedNode.uid || link.destinationUid === selectedNode.uid)) ||
                (focusedNode && (link.sourceUid === focusedNode.uid || link.destinationUid === focusedNode.uid))) {
              return true;
            }
            
            // 3. Show label if the edge is selected
            if (selectedEdge && link === selectedEdge) {
              return true; // Always show label for selected edge
            }
            
            // 4. Show labels if within zoom tolerance and no node or edge is focused/selected
            const focusedOrSelectedObjectExists = focusedEdge || selectedEdge || focusedNode || selectedNode;
            const withinZoomTolerance = globalScale > 0.6; // Equivalent to maxGlobalScale
            if (withinZoomTolerance && !focusedOrSelectedObjectExists) {
              return true;
            }
            
            // 5. Always show the label if "Show Labels" is selected
            if (showLabels) {
              return true;
            }
            
            // Otherwise, hide the label
            return false;
          };
          
          if (!showLabel()) {
            return;
          }
          
          // Get source and target coordinates with additional safety checks
          const start = { 
            x: typeof link.source.x === 'number' ? link.source.x : 0, 
            y: typeof link.source.y === 'number' ? link.source.y : 0 
          };
          const end = { 
            x: typeof link.target.x === 'number' ? link.target.x : 0, 
            y: typeof link.target.y === 'number' ? link.target.y : 0 
          };
          
          if (isNaN(start.x) || isNaN(start.y) || isNaN(end.x) || isNaN(end.y)) return;
          
          // Initialize text position at midpoint
          let textPos = {
            x: (start.x + end.x) * 0.5,
            y: (start.y + end.y) * 0.5
          };
          
          // Get edge label - using same logic from original implementation
          let label = '';
          if (link.labels && link.labels.length > 0) {
            label = link.labels[0];
          } else if ((link as any).type) {
            label = (link as any).type;
          } else if ((link as any).label) {
            label = (link as any).label;
          }
          
          if (!label) return; // Skip if no label
          
          // Handle curved edges
          const curvature = (link.curvature && link.curvature.amount) || 0;
          const selfLoop = link.sourceUid === link.destinationUid;
          
          if (Math.abs(curvature) > 0.001) {
            // Handle curved edges
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            
            // Control point for quadratic curve
            const cpX = start.x + dx / 2 - curvature * dy;
            const cpY = start.y + dy / 2 + curvature * dx;
            
            // Get the point at 50% along the quadratic curve
            const t = 0.5;
            textPos.x = Math.pow(1-t, 2) * start.x + 2 * (1-t) * t * cpX + Math.pow(t, 2) * end.x;
            textPos.y = Math.pow(1-t, 2) * start.y + 2 * (1-t) * t * cpY + Math.pow(t, 2) * end.y;
          }
          
          // Calculate text angle
          let textAngle = Math.atan2(end.y - start.y, end.x - start.x);
          if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
          if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);
          
          // Calculate max text length based on link length
          let labelTail = '';
          let maxTextLength = 50;
          
          if (!selfLoop) {
            const relLink = {x: end.x - start.x, y: end.y - start.y};
            const linkLength = Math.sqrt(relLink.x * relLink.x + relLink.y * relLink.y);
            maxTextLength = linkLength - 5;
          }
          
          // Set font size and style
          const fontSize = 2;
          const defaultTextStyle = 'normal';
          const highlightedTextStyle = 'bold';
          
          ctx.font = `${isFocused || isSelected ? highlightedTextStyle : defaultTextStyle} ${fontSize}px 'Google Sans', Roboto, Arial, sans-serif`;
          
          // Truncate text if too long
          const getTextWidth = () => (ctx.measureText(label).width + ctx.measureText(labelTail).width) * 2;
          while (getTextWidth() > maxTextLength) {
            if (label.length <= 1) {
              break;
            }
            
            label = label.substring(0, label.length - 1);
            labelTail = '...';
          }
          
          label = label + labelTail;
          const textRect = ctx.measureText(label);
          
          // Save context for rotation
          ctx.save();
          ctx.translate(textPos.x, textPos.y);
          ctx.rotate(textAngle);
          
          // Draw label background
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.fillRect(
            (-textRect.width / 2) - 1,
            (-fontSize / 2) - 1,
            textRect.width + 2,
            fontSize + 2
          );
          
          // Set text colors based on selection state
          const defaultTextColor = '#9AA0A6';
          const focusedTextColor = '#3C4043';
          const selectedTextColor = '#1A73E8';
          
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Handle text vertical offset for different browsers
          let textVerticalOffset = 0;
          if (navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1) {
            textVerticalOffset = -Math.abs(
              (textRect as any).actualBoundingBoxAscent - (textRect as any).actualBoundingBoxDescent
            ) * 0.25;
          } else {
            textVerticalOffset = (ctx.measureText("H") as any).actualBoundingBoxDescent * 0.5;
          }
          
          // Fill text with appropriate color
          ctx.fillStyle = isSelected
            ? selectedTextColor
            : isFocused
              ? focusedTextColor
              : defaultTextColor;
          
          ctx.fillText(label, 0, textVerticalOffset);
          
          // Draw border around text
          ctx.strokeStyle = isSelected
            ? selectedTextColor
            : defaultTextColor;
          
          ctx.lineWidth = 0.5;
          ctx.strokeRect(
            (-textRect.width / 2) - 1,
            (-fontSize / 2) - 1,
            textRect.width + 2,
            fontSize + 2
          );
          
          // Restore context
          ctx.restore();
        });
      
      // Set initial layout mode
      handleLayoutModeChange(LayoutModes.FORCE);
      
      // Initial data update
      if (nodes.length > 0 || edges.length > 0) {
        updateGraphData();
      }
      
      // Mark as initialized to prevent re-initialization
      setIsInitialized(true);
      
      return;
    }
    
    // Only update the data when nodes or edges change
    if (isInitialized && graphInstance.current) {
      // Use a more efficient way to detect changes
      const nodesChanged = nodes.length !== previousDataRef.current.nodes.length;
      const edgesChanged = edges.length !== previousDataRef.current.edges.length;
      
      // Only check content if lengths are the same but we suspect content changed
      let contentChanged = false;
      if (!nodesChanged && !edgesChanged) {
        // Only do this check if we have a reason to believe the data changed
        // For example, if this effect was triggered by a dependency change
        const nodeIds = new Set(nodes.map(n => n.uid));
        const prevNodeIds = new Set(previousDataRef.current.nodes.map(n => n.uid));
        
        if (nodeIds.size !== prevNodeIds.size) {
          contentChanged = true;
        } else {
          // Check if any node IDs are different
          contentChanged = Array.from(nodeIds).some(id => !prevNodeIds.has(id));
        }
        
        // Only check edges if nodes haven't changed
        if (!contentChanged) {
          const edgeSignature = new Set(edges.map(e => `${e.sourceUid}-${e.destinationUid}`));
          const prevEdgeSignature = new Set(previousDataRef.current.edges.map(e => `${e.sourceUid}-${e.destinationUid}`));
          
          if (edgeSignature.size !== prevEdgeSignature.size) {
            contentChanged = true;
          } else {
            // Check if any edge signatures are different
            contentChanged = Array.from(edgeSignature).some(sig => !prevEdgeSignature.has(sig));
          }
        }
      }
      
      if (nodesChanged || edgesChanged || contentChanged) {
        console.log('Data has changed, updating graph data', {
          nodesChanged,
          edgesChanged,
          contentChanged
        });
        updateGraphData();
      }
    }
    
    return () => {
      // Store the current ref value to avoid the cleanup issue
      const currentGraphRef = graphRef.current;
      if (graphInstance.current && currentGraphRef) {
        currentGraphRef.innerHTML = '';
        graphInstance.current = null;
        setIsInitialized(false);
      }
    };
  // Update dependencies to ensure graph updates ONLY when data changes, not on every render
  }, [nodes, edges, width, height, isInitialized, updateGraphData, handleLayoutModeChange]);
  
  // Add a separate effect to handle selection and focus changes without reinitializing the graph
  useEffect(() => {
    if (isInitialized && graphInstance.current) {
      refreshCache();
      // Replace refresh() with the correct method to update the visualization
      // Force Graph doesn't have a refresh() method, so we need to use a different approach
      graphInstance.current.nodeColor(graphInstance.current.nodeColor());
      graphInstance.current.linkColor(graphInstance.current.linkColor());
      graphInstance.current.nodeVal(graphInstance.current.nodeVal());
      graphInstance.current.linkWidth(graphInstance.current.linkWidth());
    }
  }, [selectedNode, selectedEdge, focusedNode, focusedEdge, refreshCache, isInitialized]);
  
  // Update the graph dimensions when they change
  useEffect(() => {
    if (graphInstance.current && isInitialized) {
      graphInstance.current.width(width).height(height);
    }
  }, [width, height, isInitialized]);
  
  // Handle recenter button click
  const handleRecenter = () => {
    if (graphInstance.current) {
      graphInstance.current.zoomToFit(1000, 100);
    }
  };
  
  // Handle layout change button click
  const handleLayoutChange = () => {
    // Cycle through layout modes
    const layoutModes = Object.values(LayoutModes);
    const currentIndex = layoutModes.indexOf(layoutMode);
    const nextIndex = (currentIndex + 1) % layoutModes.length;
    handleLayoutModeChange(layoutModes[nextIndex] as LayoutModes);
  };

  const toggleLabels = () => {
    setShowLabels(!showLabels);
    // Trigger graph re-render without full reinitialization
    if (graphInstance.current) {
      // Replace refresh() with the correct method to update the visualization
      graphInstance.current.nodeColor(graphInstance.current.nodeColor());
    }
  };

  // Add a debug function to reset zoom/pan capabilities
  const resetInteractions = () => {
    if (graphInstance.current) {
      console.log('Resetting zoom/pan interactions');
      try {
        // Re-enable all interactions
        graphInstance.current
          .enableZoomInteraction(true)
          .enablePanInteraction(true)
          .enableNodeDrag(true);
        
        // Reset zoom transform using the ForceGraph API
        // This is a simpler approach than using d3.zoom directly
        try {
          // First zoom out to a known state
          graphInstance.current.zoom(1, 0);
          
          // Then fit the graph to the view
          graphInstance.current.zoomToFit(400, 50);
        } catch (error) {
          console.error('Error resetting zoom:', error);
        }
        
        // Force a refresh of the graph
        graphInstance.current.nodeColor(graphInstance.current.nodeColor());
      } catch (error) {
        console.error('Error resetting interactions:', error);
      }
    }
  };

  return (
    <GraphContainer ref={graphRef}>
      <ToolsContainer>
        <ToolButton onClick={handleRecenter} title="Recenter Graph">
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#5f6368">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-7 7H3v4c0 1.1.9 2 2 2h4v-2H5v-4zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm14-2h-4v2h4v4h2V5c0-1.1-.9-2-2-2zm0 16h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4z"/>
          </svg>
        </ToolButton>
        <ToolButton onClick={handleLayoutChange} title="Change Layout">
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#5f6368">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z"/>
          </svg>
        </ToolButton>
        <ToolButton onClick={resetInteractions} title="Reset Interactions">
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#5f6368">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </ToolButton>
      </ToolsContainer>
      <LabelToggleContainer>
        <ToggleLabel>Show labels</ToggleLabel>
        <Toggle active={showLabels} onClick={toggleLabels}>
          <ToggleHandle active={showLabels} />
        </Toggle>
      </LabelToggleContainer>
    </GraphContainer>
  );
};

export default ForceGraph; 