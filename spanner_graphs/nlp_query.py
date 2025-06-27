# Copyright 2025 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Natural Language to Query (NL2Q) service for Spanner Graph databases."""

import os
from enum import Enum
from typing import Dict, Any, Optional
from google.cloud import spanner
from langchain_google_vertexai import ChatVertexAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import vertexai

from spanner_graphs.exec_env import get_database_instance
from spanner_graphs.database import SpannerQueryResult


class QueryType(Enum):
    """Supported query types for NLP processing."""
    SQL = "sql"
    GQL = "gql"
    AUTO = "auto"  # Let the model decide


class SpannerNL2Query:
    """Natural Language to Query converter for Spanner Graph databases."""
    
    def __init__(self, project_id: str, instance_id: str, database_id: str, 
                 location: str = "us-central1", mock: bool = False):
        """
        Initialize Spanner NL2Query converter that can handle both SQL and GQL
        
        Args:
            project_id: Google Cloud project ID
            instance_id: Spanner instance ID
            database_id: Spanner database ID
            location: Vertex AI location (default: us-central1)
            mock: Whether to use mock database for testing
        """
        self.project_id = project_id
        self.instance_id = instance_id
        self.database_id = database_id
        self.mock = mock
        
        # Initialize Vertex AI
        try:
            vertexai.init(project=project_id, location=location)
            
            # Initialize Gemini model
            self.llm = ChatVertexAI(
                model_name="gemini-1.5-pro",
                temperature=0,
                max_output_tokens=2048
            )
            self.vertex_ai_available = True
        except Exception as e:
            print(f"Warning: Vertex AI initialization failed: {e}")
            print("NLP query functionality will be limited")
            self.llm = None
            self.vertex_ai_available = False
        
        # Get database instance
        self.db_instance = get_database_instance(project_id, instance_id, database_id, mock)
        
        # Cache schemas
        self.sql_schema = None
        self.graph_schema = None
        
        # Setup prompt templates
        self._setup_prompts()
        
    def _get_sql_schema(self) -> str:
        """Get SQL table schema from the database."""
        if self.sql_schema is not None:
            return self.sql_schema
            
        schema_query = """
        SELECT 
            t.table_name,
            c.column_name,
            c.spanner_type,
            c.is_nullable
        FROM information_schema.tables t
        JOIN information_schema.columns c 
            ON t.table_name = c.table_name
        WHERE t.table_catalog = '' 
            AND t.table_schema = ''
            AND t.table_name NOT LIKE '%_Graph_%'
        ORDER BY t.table_name, c.ordinal_position
        """
        
        try:
            result: SpannerQueryResult = self.db_instance.execute_query(schema_query)
            
            if result.err:
                return "Schema information not available"
            
            schema_info = []
            current_table = None
            table_columns = []
            
            for row in result.rows:
                table_name, column_name, column_type, is_nullable = row
                
                if current_table != table_name:
                    if current_table is not None:
                        schema_info.append(f"Table: {current_table}")
                        schema_info.extend([f"  - {col}" for col in table_columns])
                        schema_info.append("")
                    
                    current_table = table_name
                    table_columns = []
                
                nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
                table_columns.append(f"{column_name}: {column_type} ({nullable})")
            
            if current_table is not None:
                schema_info.append(f"Table: {current_table}")
                schema_info.extend([f"  - {col}" for col in table_columns])
            
            self.sql_schema = "\n".join(schema_info)
            return self.sql_schema
            
        except Exception as e:
            return f"Error retrieving SQL schema: {str(e)}"
    
    def _get_graph_schema(self) -> str:
        """Get graph schema information from the database."""
        if self.graph_schema is not None:
            return self.graph_schema
            
        try:
            # First try to get graph-specific tables
            graph_query = """
            SELECT 
                table_name,
                column_name,
                spanner_type
            FROM information_schema.columns 
            WHERE table_name LIKE '%_Graph_%'
            ORDER BY table_name, ordinal_position
            """
            
            schema_info = ["GRAPH SCHEMA:"]
            result: SpannerQueryResult = self.db_instance.execute_query(graph_query)
            
            if not result.err and result.rows:
                current_table = None
                for row in result.rows:
                    table_name, column_name, column_type = row
                    
                    if current_table != table_name:
                        if current_table is not None:
                            schema_info.append("")
                        schema_info.append(f"Graph Table: {table_name}")
                        current_table = table_name
                    
                    schema_info.append(f"  - {column_name}: {column_type}")
            
            # Add example graph structure (customize based on common patterns)
            schema_info.extend([
                "",
                "EXAMPLE GRAPH STRUCTURE:",
                "Nodes: Person, Company, Product",
                "Edges: WORKS_FOR (Person -> Company), BOUGHT (Person -> Product), SELLS (Company -> Product)",
                "Node Properties: Person(id, name, age), Company(id, name, industry), Product(id, name, price)",
                "Edge Properties: WORKS_FOR(since_date), BOUGHT(purchase_date, quantity), SELLS(price)"
            ])
            
            self.graph_schema = "\n".join(schema_info)
            return self.graph_schema
            
        except Exception as e:
            fallback_schema = [
                "GRAPH SCHEMA:",
                "Graph schema not available or not configured",
                "",
                "EXAMPLE GRAPH STRUCTURE:",
                "Nodes: Person, Company, Product",
                "Edges: WORKS_FOR (Person -> Company), BOUGHT (Person -> Product), SELLS (Company -> Product)",
                "Node Properties: Person(id, name, age), Company(id, name, industry), Product(id, name, price)",
                "Edge Properties: WORKS_FOR(since_date), BOUGHT(purchase_date, quantity), SELLS(price)"
            ]
            self.graph_schema = "\n".join(fallback_schema)
            return self.graph_schema
    
    def _setup_prompts(self):
        """Setup prompt templates for different query types."""
        
        # GQL-specific prompt
        self.gql_prompt = PromptTemplate(
            input_variables=["graph_schema", "question"],
            template="""
You are an expert at converting natural language to Graph Query Language (GQL) for Google Cloud Spanner.

{graph_schema}

GQL Syntax Rules:
1. Use GRAPH <graph_name> to specify the graph
2. Use MATCH clauses to find patterns: MATCH (n:NodeType)-[r:EdgeType]->(m:NodeType)
3. Use WHERE clauses for filtering: WHERE n.property = 'value'
4. Use RETURN to specify what to return: RETURN n.name, r.weight
5. Node variables: (n:Person), (c:Company)
6. Edge variables: -[r:WORKS_FOR]->
7. Use aggregations: COUNT(), SUM(), AVG()
8. Use ORDER BY, LIMIT for sorting and limiting

GQL Examples:
- Find all people: GRAPH MyGraph MATCH (p:Person) RETURN p.name
- Find connections: GRAPH MyGraph MATCH (p:Person)-[r:WORKS_FOR]->(c:Company) RETURN p.name, c.name
- Count relationships: GRAPH MyGraph MATCH (p:Person)-[r:WORKS_FOR]->(c:Company) RETURN COUNT(*)

Human Question: {question}

Generate only valid GQL query:"""
        )
        
        # SQL prompt
        self.sql_prompt = PromptTemplate(
            input_variables=["sql_schema", "question"],
            template="""
You are an expert SQL query generator for Google Cloud Spanner databases.

Database Schema:
{sql_schema}

Rules:
1. Generate ONLY valid GoogleSQL (Spanner's SQL dialect) queries
2. Use proper table and column names from the schema above
3. Do not include any explanations, just the SQL query
4. Ensure the query is safe and read-only (SELECT operations only)
5. Use appropriate WHERE clauses and JOINs when needed
6. Format the query properly with line breaks

Human Question: {question}

SQL Query:"""
        )
        
        # Auto-detection prompt
        self.auto_prompt = PromptTemplate(
            input_variables=["sql_schema", "graph_schema", "question"],
            template="""
You are an expert at analyzing questions and determining whether they require SQL (for tabular data) or GQL (for graph/relationship data).

SQL Schema:
{sql_schema}

{graph_schema}

Question: {question}

Determine if this question is about:
1. GRAPH: relationships, connections, paths, network analysis, social connections, recommendations
2. SQL: aggregations, simple filtering, reporting, counting records, date ranges

If GRAPH, generate a GQL query using the graph schema.
If SQL, generate a SQL query using the SQL schema.

First line should be either "TYPE: GQL" or "TYPE: SQL"
Then provide the appropriate query.

Response:"""
        )
    
    def generate_query(self, question: str, query_type: QueryType = QueryType.AUTO) -> Dict[str, Any]:
        """
        Generate either SQL or GQL query based on the question
        
        Args:
            question: Natural language question
            query_type: Type of query to generate (SQL, GQL, or AUTO)
            
        Returns:
            Dictionary with query type, query string, and metadata
        """
        if not self.vertex_ai_available:
            return {
                "question": question,
                "query_type": None,
                "query": None,
                "error": "Vertex AI is not available. Cannot generate NLP queries.",
                "success": False
            }
        
        try:
            if query_type == QueryType.SQL:
                chain = self.sql_prompt | self.llm | StrOutputParser()
                query = chain.invoke({
                    "sql_schema": self._get_sql_schema(),
                    "question": question
                })
                detected_type = "SQL"
                
            elif query_type == QueryType.GQL:
                chain = self.gql_prompt | self.llm | StrOutputParser()
                query = chain.invoke({
                    "graph_schema": self._get_graph_schema(),
                    "question": question
                })
                detected_type = "GQL"
                
            else:  # AUTO
                chain = self.auto_prompt | self.llm | StrOutputParser()
                response = chain.invoke({
                    "sql_schema": self._get_sql_schema(),
                    "graph_schema": self._get_graph_schema(),
                    "question": question
                })
                
                # Parse the response to extract type and query
                lines = response.strip().split('\n')
                if lines[0].startswith("TYPE:"):
                    detected_type = lines[0].split(":")[1].strip()
                    query = '\n'.join(lines[1:]).strip()
                else:
                    # Fallback - try to detect from content
                    if "GRAPH" in response.upper() and "MATCH" in response.upper():
                        detected_type = "GQL"
                    else:
                        detected_type = "SQL"
                    query = response
            
            # Clean up the query
            query = self._clean_query(query)
            
            return {
                "question": question,
                "query_type": detected_type,
                "query": query,
                "success": True
            }
            
        except Exception as e:
            return {
                "question": question,
                "query_type": None,
                "query": None,
                "error": f"Error generating query: {str(e)}",
                "success": False
            }
    
    def _clean_query(self, query: str) -> str:
        """Clean up generated query."""
        query = query.strip()
        
        # Remove markdown formatting
        if query.startswith("```"):
            lines = query.split('\n')
            if len(lines) > 1:
                query = '\n'.join(lines[1:])
            if query.endswith("```"):
                query = query[:-3]
        
        return query.strip()
    
    def execute_query(self, query: str, query_type: str) -> SpannerQueryResult:
        """
        Execute SQL or GQL query
        
        Args:
            query: Query string
            query_type: "SQL" or "GQL"
            
        Returns:
            SpannerQueryResult object
        """
        try:
            # Both SQL and GQL are executed through the same interface in Spanner
            result: SpannerQueryResult = self.db_instance.execute_query(query)
            return result
                
        except Exception as e:
            # Create error result
            error_result = SpannerQueryResult(rows=[], column_names=[], column_types=[])
            error_result.err = Exception(f"Error executing {query_type} query: {str(e)}")
            return error_result
    
    def ask_question(self, question: str, query_type: QueryType = QueryType.AUTO) -> Dict[str, Any]:
        """
        Complete pipeline: natural language -> query -> results
        
        Args:
            question: Natural language question
            query_type: Type of query to generate
            
        Returns:
            Complete result with query and data
        """
        try:
            # Generate query
            query_result = self.generate_query(question, query_type)
            
            if not query_result["success"]:
                return query_result
            
            # Execute query
            result = self.execute_query(query_result["query"], query_result["query_type"])
            
            if result.err:
                return {
                    "question": question,
                    "query_type": query_result["query_type"],
                    "query": query_result["query"],
                    "error": str(result.err),
                    "success": False
                }
            
            return {
                "question": question,
                "query_type": query_result["query_type"],
                "query": query_result["query"],
                "results": result.rows,
                "column_names": result.column_names,
                "column_types": result.column_types,
                "row_count": len(result.rows),
                "success": True
            }
            
        except Exception as e:
            return {
                "question": question,
                "query_type": query_result.get("query_type") if 'query_result' in locals() else None,
                "query": query_result.get("query") if 'query_result' in locals() else None,
                "error": str(e),
                "success": False
            }
