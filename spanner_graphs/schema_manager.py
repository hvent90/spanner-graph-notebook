from __future__ import annotations

from typing import Dict, List, Set
from .graph_entities import Node

class SchemaManager:
    def __init__(self, schema_json: dict = None):
        self.schema_dict = schema_json or {}
        self.node_label_to_property_names = self._build_node_mappings()
        self.unique_node_labels = self._find_unique_node_labels()

    def _find_unique_node_labels(self) -> Set[str]:
        label_count = {}
        for node_table in self.schema_dict.get('nodeTables', []):
            labelNames = node_table.get('labelNames', [])
            if len(labelNames) == 1:
                label = labelNames[0]
                label_count[label] = label_count.get(label, 0) + 1
        return { label for label, count in label_count.items() if count == 1}

    def _build_node_mappings(self) -> Dict[str, List[str]]:
        node_label_to_property_names = {}
        for node_table in self.schema_dict.get('nodeTables', []):
            labelNames = node_table.get('labelNames', [])
            if len(labelNames) != 1:
                continue

            keyColumns = node_table.get('keyColumns', [])
            propertyDefinitions = node_table.get('propertyDefinitions', [])
            label = labelNames[0]
            key_property_names = []
            for keyColumn in keyColumns:
                for prop in propertyDefinitions:
                    if prop.get('valueExpressionSql', '') == keyColumn:
                        key_property_names.append(prop.get('propertyDeclarationName'))
                        break
            node_label_to_property_names[label] = key_property_names

        return node_label_to_property_names

    def get_key_property_names(self, obj: Node) -> List[str]:
        if not isinstance(obj, Node):
            raise TypeError("node expected")
        if len(obj.labels) == 1 and obj.labels[0] in self.unique_node_labels:
            return self.node_label_to_property_names.get(obj.labels[0], [])
        return []
