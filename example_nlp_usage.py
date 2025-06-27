#!/usr/bin/env python3
"""
Example usage of the Natural Language Query feature for Spanner Graph Notebook.

This demonstrates how to use the NLP functionality to query Spanner databases
using natural language questions.
"""

import os
import json
from typing import Dict, Any

# Note: In practice, these would be imported from the spanner_graphs package
# from spanner_graphs.nlp_query import SpannerNL2Query, QueryType

def example_usage():
    """
    Example of how to use the NLP query functionality.
    
    This example assumes you have:
    1. Google Cloud credentials configured
    2. Vertex AI API enabled
    3. A Spanner database with graph data
    """
    
    print("=== Spanner Graph NLP Query Example ===")
    
    # Configuration
    PROJECT_ID = "your-project-id"
    INSTANCE_ID = "your-instance-id"
    DATABASE_ID = "your-database-id"
    
    print(f"Connecting to: {PROJECT_ID}/{INSTANCE_ID}/{DATABASE_ID}")
    
    try:
        # Initialize the NLP service
        # nl2q = SpannerNL2Query(
        #     project_id=PROJECT_ID,
        #     instance_id=INSTANCE_ID,
        #     database_id=DATABASE_ID
        # )
        
        # For demonstration, we'll show the expected interface
        print("\n✓ NLP service initialized")
        
        # Example questions and expected results
        example_questions = [
            {
                "question": "Show me all the people in the database",
                "expected_type": "SQL",
                "expected_query": "SELECT * FROM Person LIMIT 100"
            },
            {
                "question": "Find all connections between users",
                "expected_type": "GQL", 
                "expected_query": "GRAPH MyGraph MATCH (p1:Person)-[r]->(p2:Person) RETURN p1.name, r, p2.name"
            },
            {
                "question": "What companies does John Smith work for?",
                "expected_type": "GQL",
                "expected_query": "GRAPH MyGraph MATCH (p:Person {name: 'John Smith'})-[r:WORKS_FOR]->(c:Company) RETURN c.name"
            },
            {
                "question": "Count the total number of products",
                "expected_type": "SQL",
                "expected_query": "SELECT COUNT(*) as total_products FROM Product"
            },
            {
                "question": "Find the shortest path between Alice and Bob",
                "expected_type": "GQL",
                "expected_query": "GRAPH MyGraph MATCH path = shortestPath((a:Person {name: 'Alice'})-[*]-(b:Person {name: 'Bob'})) RETURN path"
            }
        ]
        
        print("\n=== Example Natural Language Queries ===")
        
        for i, example in enumerate(example_questions, 1):
            print(f"\n{i}. Question: '{example['question']}'")
            print(f"   Expected Type: {example['expected_type']}")
            print(f"   Expected Query: {example['expected_query']}")
            
            # In practice, you would call:
            # result = nl2q.ask_question(example['question'])
            # if result['success']:
            #     print(f"   Generated: {result['query']}")
            #     print(f"   Results: {result['row_count']} rows")
            # else:
            #     print(f"   Error: {result['error']}")
            
            # For demonstration:
            mock_result = {
                "success": True,
                "question": example["question"],
                "query_type": example["expected_type"],
                "query": example["expected_query"],
                "row_count": 5,  # Mock result
                "results": [["sample", "data", "here"]]  # Mock data
            }
            print(f"   ✓ Mock result: {mock_result['row_count']} rows returned")
        
        print("\n=== Query Generation Only ===")
        
        # Example of just generating queries without executing
        question = "Show me all companies in the technology sector"
        print(f"\nGenerating query for: '{question}'")
        
        # In practice:
        # query_result = nl2q.generate_query(question, QueryType.AUTO)
        # if query_result['success']:
        #     print(f"Generated {query_result['query_type']} query:")
        #     print(query_result['query'])
        
        # Mock demonstration:
        mock_query_result = {
            "success": True,
            "question": question,
            "query_type": "SQL",
            "query": "SELECT * FROM Company WHERE industry = 'Technology' LIMIT 100"
        }
        print(f"✓ Generated {mock_query_result['query_type']} query:")
        print(f"  {mock_query_result['query']}")
        
        print("\n=== Frontend Integration ===")
        print("In Jupyter/Colab notebooks:")
        print("1. Load the extension: %load_ext spanner_graphs")
        print("2. Use the magic command with your connection parameters")
        print("3. Click the 'Ask in Natural Language' button in the interface")
        print("4. Type your question and click 'Ask & Execute'")
        
        print("\n=== API Usage ===")
        print("HTTP endpoints are available at:")
        print("- POST /post_nlp_query - Execute natural language query")
        print("- POST /post_nlp_generate - Generate query without executing")
        
        example_request = {
            "question": "Find all users who joined last month",
            "query_type": "auto",
            "params": json.dumps({
                "project": PROJECT_ID,
                "instance": INSTANCE_ID,
                "database": DATABASE_ID,
                "mock": False
            })
        }
        print(f"\nExample request body:")
        print(json.dumps(example_request, indent=2))
        
    except Exception as e:
        print(f"\n✗ Error in example: {e}")
        print("Note: This is a demonstration. Actual usage requires:")
        print("- Proper Google Cloud authentication")
        print("- Vertex AI API enabled")
        print("- spanner_graphs package installed with dependencies")
    
    print("\n=== Example completed ===")

def jupyter_notebook_example():
    """
    Example of how this would be used in a Jupyter notebook.
    """
    notebook_code = """
# In a Jupyter/Colab notebook cell:

%load_ext spanner_graphs

%%spanner_graph --project=my-project --instance=my-instance --database=my-db
SELECT * FROM Person LIMIT 10

# After running the above, you'll see the graph interface with:
# - An "Ask in Natural Language" button in the toolbar
# - Click it to open the NLP query panel
# - Type questions like:
#   "Show me all people who work at Google"
#   "Find connections between John and Mary"
#   "What are the most popular products?"
"""
    
    print("\n=== Jupyter Notebook Usage ===")
    print(notebook_code)

if __name__ == "__main__":
    example_usage()
    jupyter_notebook_example()
