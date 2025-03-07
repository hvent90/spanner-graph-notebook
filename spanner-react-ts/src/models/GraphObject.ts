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

export type GraphObjectUID = string;

export interface GraphObjectParams {
  labels: string[];
  properties?: Record<string, any>;
  key_property_names?: string[];
  identifier: string;
  title?: string;
}

export class GraphObject {
  /**
   * The label of the Graph Object.
   */
  labels: string[] = [];

  /**
   * A map of properties and their values describing the Graph Object.
   */
  properties: Record<string, any> = {};

  /**
   * A boolean indicating if the Graph Object has been instantiated.
   */
  instantiated: boolean = false;

  /**
   * The key property names for the graph element determines what keys in the properties
   * are to be displayed.
   */
  key_property_names: string[] = [];

  /**
   * The reason for the instantiation error.
   */
  instantiationErrorReason?: string;

  /**
   * Corresponds to "identifier" in Spanner
   */
  uid: GraphObjectUID = '';

  /**
   * An object that renders on the graph.
   */
  constructor({ labels, properties = {}, key_property_names = [], identifier, title }: GraphObjectParams) {
    if (!Array.isArray(labels)) {
      throw new TypeError('labels must be an Array');
    }

    if (!this.validUid(identifier)) {
      throw new TypeError('Invalid identifier');
    }

    this.labels = labels;
    this.properties = properties;
    this.key_property_names = key_property_names;
    this.uid = identifier;
    this.instantiated = true;
  }

  /**
   * @returns {string}
   */
  getDisplayName(): string {
    return this.labels[0];
  }

  /**
   * @private
   */
  protected validUid(uid: GraphObjectUID): boolean {
    return (typeof uid === 'string') && uid.length > 0;
  }
}

export default GraphObject; 