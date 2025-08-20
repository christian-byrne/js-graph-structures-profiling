# Graph Data Structure Performance Benchmarks

This project compares the performance characteristics of four common graph representation approaches: adjacency matrices with bitset optimization, adjacency lists with set-based lookups, a combined approach maintaining both representations, and an object-oriented design similar to LiteGraph. 

## Features

- **Command Line Interface**: Automated benchmarking with configurable parameters
- **Interactive Web Interface**: Real-time visualization and analysis
- **Real Performance Data**: Actual memory usage and timing measurements
- **Multiple Metrics**: Memory usage, lookup speed, traversal performance, and graph sparsity

## Usage

### Web Interface
```bash
npm install
npm run dev
```

### Command Line Benchmarking
```bash
npm run benchmark
```

Results are exported in JSON and CSV formats with algorithmic complexity analysis to guide implementation decisions.

## Graph Representations

1. **Adjacency Matrix (AM)**: Bitset-optimized O(n²) space
2. **Adjacency List (AL)**: Set-based O(n+m) space  
3. **Combined (AM+AL)**: Hybrid approach for optimal access patterns
4. **Object-Oriented (OOP)**: Node/Link architecture similar to LiteGraph