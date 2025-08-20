# Graph Data Structure Performance Benchmarks

This project compares the performance characteristics of four common graph representation approaches: adjacency matrices with bitset optimization, adjacency lists with set-based lookups, a combined approach maintaining both representations, and an object-oriented design similar to LiteGraph. The benchmarking suite measures memory usage, edge lookup performance, and vertex traversal speed across graphs of varying sizes and sparsity levels.

The implementation includes both a command-line interface for automated testing and an interactive web application for real-time experimentation. Each approach is tested under realistic conditions that simulate common graph operations found in applications like social networks, routing algorithms, and visual node editors.

Users can configure test parameters including node counts, sample sizes, and graph sparsity to understand how each representation scales with different graph characteristics. Results are exported in standard formats and include algorithmic complexity analysis to guide implementation decisions.