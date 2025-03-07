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

import GraphObject, { GraphObjectParams, GraphObjectUID } from './GraphObject';
import { GraphNode } from './GraphNode';

export interface GraphEdgeParams extends GraphObjectParams {
  source_node_identifier: GraphObjectUID;
  destination_node_identifier: GraphObjectUID;
}

/**
 * Direction enum for edge traversal
 */
export enum Direction {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING'
}

/**
 * Represents a graph edge.
 * @class
 * @extends GraphObject
 */
export class GraphEdge extends GraphObject {
  /**
   * Preserve the UID from being overwritten by ForceGraph
   */
  sourceUid: GraphObjectUID = '';

  /**
   * Preserve the UID from being overwritten by ForceGraph
   */
  destinationUid: GraphObjectUID = '';

  /**
   * ForceGraph inserts a Node reference
   */
  source?: GraphNode;

  /**
   * ForceGraph inserts a Node reference
   */
  target?: GraphNode;

  /**
   * Controls the curvature of the edge when rendered in ForceGraph
   */
  curvature: {
    amount: number;
    nodePairId: string;
  } = {
    amount: 0,
    nodePairId: '',
  };

  /**
   * An edge is the line that connects two Nodes.
   */
  constructor(params: GraphEdgeParams) {
    const { source_node_identifier, destination_node_identifier, ...otherParams } = params;
    super(otherParams);

    if (!this.validUid(source_node_identifier) || !this.validUid(destination_node_identifier)) {
      this.instantiationErrorReason = 'Edge destination or source invalid';
      this.instantiated = false;
      console.error(this.instantiationErrorReason, params);
      return;
    }

    /**
     * preserve ID from getting
     * overwritten by ForceGraph
     */
    this.sourceUid = source_node_identifier;
    this.destinationUid = destination_node_identifier;

    this.instantiated = true;
  }
}

export default GraphEdge; 