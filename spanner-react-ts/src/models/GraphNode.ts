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

import GraphObject, { GraphObjectParams } from './GraphObject';

export interface GraphNodeParams extends GraphObjectParams {
  value?: number;
}

/**
 * Represents a graph node.
 * @class
 * @extends GraphObject
 */
export class GraphNode extends GraphObject {
  /**
   * Arbitrary value
   */
  value?: number;

  /**
   * Human-readable properties that serve to identify or distinguish the node.
   * For example, a Node with a label of "Movie" may have a key_property_names
   * of value ['title'], where "title" is the name of a property that serves to
   * most-effectively distinguish the node from its peers. Using this knowledge,
   * displaying node.properties.title to the user would be helpful to them.
   */
  identifiers: string[] = [];

  // The following properties will be set by ForceGraph
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  vx?: number;
  vy?: number;

  /**
   * A node on the graph
   */
  constructor(params: GraphNodeParams) {
    const { value, ...otherParams } = params;
    super(otherParams);

    this.value = value;
    this.instantiated = true;

    // Parse the human-readable unique identifiers that
    // distinguishes a node from its peers
    if (typeof this.properties === 'object' && Array.isArray(this.key_property_names)) {
      for (let i = 0; i < this.key_property_names.length; i++) {
        const identifier = this.properties[this.key_property_names[i]];
        if (identifier) {
          this.identifiers.push(identifier);
        }
      }
    }

    if (!this.identifiers.length) {
      this.identifiers.push('Node');
    }
  }
}

export default GraphNode; 