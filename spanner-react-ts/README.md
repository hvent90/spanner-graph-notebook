# Spanner Graph Visualization

A modern React TypeScript application for visualizing Spanner graph data.

## Features

- Interactive graph visualization using force-directed layout
- TypeScript for improved type safety and developer experience
- React hooks and context API for state management
- Component-based architecture for better maintainability
- Responsive design that adapts to different screen sizes
- Query interface for executing custom graph queries

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

## Project Structure

```
src/
  ├── components/        # React components
  |   └── visualization/ # Graph visualization components
  ├── contexts/          # React contexts for state management
  ├── models/            # TypeScript classes and interfaces
  ├── pages/             # Page components
  ├── services/          # API services
  ├── utils/             # Utility functions
  ├── App.tsx            # Main application component
  └── index.tsx          # Application entry point
```

## Key Components

- **GraphNode**: Represents a node in the graph
- **GraphEdge**: Represents an edge between two nodes
- **ForceGraph**: Interactive graph visualization
- **Sidebar**: Displays details of selected nodes and edges
- **QueryBox**: Input for custom graph queries

## Development

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production

## License

Copyright 2025 Google LLC. Licensed under the Apache License, Version 2.0.
