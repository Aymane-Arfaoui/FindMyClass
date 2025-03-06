from graph import *

if __name__ == "__main__":
    SCALE_FACTOR_METERS_PER_UNIT = 0.05  # Adjust this based on your real-world measurements

    # Load your graph from JSON file with scaling factor applied
    graph = load_graph_from_json("/Users/evanteboul/SOEN390/FindMyClass/api/app/data/map_hall_2.json",
                                 scale_factor=SCALE_FACTOR_METERS_PER_UNIT)

    # Find shortest path example:
    start_node = "h2_209"  # replace with actual start node ID from your JSON file
    end_node = "h2_260"  # replace with actual end node ID from your JSON file

    result = find_shortest_path(graph, start_node, end_node)

    if result:
        print(f"Shortest path from {start_node} to {end_node}: {result['path']}")
        print(f"Total distance: {result['distance']:.2f} meters")
    else:
        print(f"No path found between {start_node} and {end_node}.")


    top_paths = yen_k_shortest_paths(graph, start_node, end_node, K=3)

    if top_paths:
        print(f"Top {len(top_paths)} shortest paths from '{start_node}' to '{end_node}':\n")
        for idx, path_info in enumerate(top_paths, start=1):
            print(f"Path {idx}: {' -> '.join(path_info['path'])}")
            print(f"Total Distance: {path_info['distance']:.2f} meters\n")
    else:
        print(f"No paths found between '{start_node}' and '{end_node}'.")
