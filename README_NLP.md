# Natural Language Querying for Spanner Graph Notebook

This implementation adds natural language processing (NLP) capabilities to the Spanner Graph Notebook, allowing users to query their Spanner database using plain English questions.

## Features

- **Natural Language to SQL/GQL**: Convert natural language questions into SQL or GQL queries
- **Auto-detection**: Automatically determine whether a question requires SQL or GQL
- **Frontend Integration**: User-friendly interface integrated into the notebook toolbar
- **Colab Support**: Full integration with Google Colab notebooks
- **Mock Mode**: Testing support without requiring actual Spanner database

## Architecture

### Backend Components

1. **`spanner_graphs/nlp_query.py`**: Core NLP service
   - `SpannerNL2Query` class for natural language processing
   - Schema introspection and query generation
   - Integration with Vertex AI and LangChain

2. **`spanner_graphs/graph_server.py`** (Updated):
   - New endpoints: `/post_nlp_query` and `/post_nlp_generate`
   - Handler methods for NLP requests
   - Integration with existing query execution pipeline

3. **`spanner_graphs/magics.py`** (Updated):
   - Colab callback functions for NLP functionality
   - `receive_nlp_query_request()` and `receive_nlp_generate_request()`

### Frontend Components

1. **`frontend/src/visualization/spanner-nlp.js`**: NLP interface component
   - Natural language input with example suggestions
   - Query type selection (Auto, SQL, GQL)
   - Results display and query preview

2. **`frontend/src/graph-server.js`** (Updated):
   - New methods: `nlpQuery()` and `nlpGenerate()`
   - Client-side API for NLP requests

3. **`frontend/src/app.js`** (Updated):
   - Integration of NLP component into main app
   - Initialization and lifecycle management

## Usage Examples

### Basic Usage

```python
# In a Jupyter/Colab notebook
%load_ext spanner_graphs

%%spanner_graph --project=my-project --instance=my-instance --database=my-db
# Use the "Ask in Natural Language" button in the interface
```

### Programmatic Usage

```python
from spanner_graphs.nlp_query import SpannerNL2Query, QueryType

# Initialize the NLP service
nl2q = SpannerNL2Query(
    project_id="your-project-id",
    instance_id="your-instance-id",
    database_id="your-database-id"
)

# Ask a question and get results
result = nl2q.ask_question("Show me all users who work at Google")
if result["success"]:
    print(f"Generated {result['query_type']} query:")
    print(result["query"])
    print(f"Found {result['row_count']} results")
else:
    print(f"Error: {result['error']}")

# Just generate a query without executing
query_result = nl2q.generate_query("Find the shortest path between two people")
if query_result["success"]:
    print(f"Generated query: {query_result['query']}")
```

## Example Questions

The system can handle various types of natural language queries:

### Graph/Relationship Queries (Generate GQL)
- "Show me all connections between Person A and Person B"
- "Find the shortest path from John to Microsoft"
- "What companies does Sarah work for?"
- "Who are the friends of friends of Alice?"
- "Show me all people who bought the same product as Bob"

### Tabular/Analytical Queries (Generate SQL)
- "How many users signed up last month?"
- "What's the average age of all users?"
- "Show me all orders from California"
- "Count the total number of products"
- "List all users created after 2023-01-01"

## Configuration

### Dependencies

Add to your `requirements.txt` or install:

```bash
pip install langchain-google-vertexai langchain-core google-cloud-aiplatform
```

### Environment Setup

1. **Google Cloud Authentication**: Ensure you have proper credentials for Vertex AI
2. **Vertex AI API**: Enable the Vertex AI API in your Google Cloud project
3. **Permissions**: Ensure your service account has access to both Spanner and Vertex AI

### Configuration Options

```python
# Custom configuration
nl2q = SpannerNL2Query(
    project_id="your-project",
    instance_id="your-instance", 
    database_id="your-database",
    location="us-central1",  # Vertex AI location
    mock=False  # Set to True for testing without real database
)
```

## API Reference

### SpannerNL2Query Class

#### Methods

**`generate_query(question: str, query_type: QueryType = QueryType.AUTO) -> Dict`**
- Generates SQL or GQL query from natural language
- Returns: `{"question": str, "query_type": str, "query": str, "success": bool}`

**`execute_query(query: str, query_type: str) -> SpannerQueryResult`**
- Executes a SQL or GQL query against the database
- Returns: SpannerQueryResult object

**`ask_question(question: str, query_type: QueryType = QueryType.AUTO) -> Dict`**
- Complete pipeline: generates and executes query
- Returns: Full result with query, data, and metadata

### HTTP API Endpoints

**`POST /post_nlp_query`**
```json
{
  "question": "Show me all users",
  "query_type": "auto",
  "params": "{\"project\": \"...\", \"instance\": \"...\", \"database\": \"...\"}"
}
```

**`POST /post_nlp_generate`**
```json
{
  "question": "Find all connections",
  "query_type": "gql",
  "params": "{\"project\": \"...\", \"instance\": \"...\", \"database\": \"...\"}"
}
```

## Frontend Interface

The NLP interface appears as a blue "Ask in Natural Language" button in the notebook toolbar. Clicking it opens a panel with:

1. **Text Area**: Enter your natural language question
2. **Query Type Selector**: Choose Auto-detect, SQL, or GQL
3. **Action Buttons**: 
   - "Generate Query": Create query without executing
   - "Ask & Execute": Generate and run the query
4. **Example Questions**: Click to populate the input field
5. **Results Display**: Shows generated queries and execution results

## Error Handling

The system includes comprehensive error handling:

- **Missing Dependencies**: Graceful fallback when LangChain/Vertex AI unavailable
- **Invalid Queries**: Clear error messages for malformed questions
- **Database Errors**: Proper propagation of Spanner-specific errors
- **API Limits**: Handling of Vertex AI rate limits and quotas

## Testing

The implementation includes mock mode for testing without real infrastructure:

```python
# Test with mock database
nl2q = SpannerNL2Query(
    project_id="test-project",
    instance_id="test-instance",
    database_id="test-database",
    mock=True
)
```

## Integration Notes

### Jupyter Notebooks
- The NLP interface integrates seamlessly with existing magic commands
- Results are displayed in the same visualization format as manual queries
- Full support for all existing features (graph view, table view, schema view)

### Google Colab
- Uses Colab's callback system for backend communication
- No additional setup required beyond standard Spanner Graph Notebook installation
- Automatic fallback to HTTP endpoints in other environments

## Troubleshooting

### Common Issues

1. **"Vertex AI not available"**: 
   - Ensure Google Cloud credentials are properly configured
   - Verify Vertex AI API is enabled in your project
   - Check service account permissions

2. **Query generation fails**:
   - Verify your database schema is accessible
   - Try more specific questions
   - Check Vertex AI quotas and limits

3. **Frontend not loading**:
   - Rebuild frontend: `cd frontend && npm run build:notebook`
   - Clear browser cache
   - Check browser console for JavaScript errors

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Performance Considerations

- **Schema Caching**: Database schemas are cached to reduce query overhead
- **Query Optimization**: Generated queries include appropriate LIMIT clauses
- **Rate Limiting**: Respects Vertex AI API rate limits
- **Connection Pooling**: Reuses database connections when possible

## Security

- **Query Validation**: All generated queries are validated before execution
- **Read-Only Operations**: Only SELECT queries are generated (no INSERT/UPDATE/DELETE)
- **Parameter Binding**: Proper escaping and parameter binding to prevent injection
- **Access Control**: Inherits existing Spanner database permissions

## Future Enhancements

- Support for more complex graph traversals
- Integration with additional LLM providers
- Query result summarization and insights
- Natural language result explanations
- Voice input support
- Multi-language query support

---

**Note**: This feature requires Google Cloud Vertex AI access and appropriate billing setup. The NLP functionality will gracefully degrade if these services are unavailable, allowing the rest of the notebook to function normally.
