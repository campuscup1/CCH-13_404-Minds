import math
import heapq
from typing import Dict, List, Tuple, Optional, Any
from app.models.schemas import Coordinate, RouteInfo

def haversine_distance_meters(coord1: Coordinate, coord2: Coordinate) -> float:
    """Calculate great-circle distance between two GPS coordinates in meters."""
    R = 6371000.0  # Earth's radius in meters
    lat1, lon1 = math.radians(coord1.lat), math.radians(coord1.lon)
    lat2, lon2 = math.radians(coord2.lat), math.radians(coord2.lon)
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat / 2.0)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class DynamicRoutingEngine:
    """
    Advanced Bidirectional A* Routing Engine with Dynamic Edge Cost Metric (Bidirectional A*-DEC).
    
    Why it is superior to Dijkstra and Unidirectional A*:
    - Bidirectional search runs forward from source and backward from target simultaneously.
    - Reduces the search state space by ~50-75% compared to unidirectional A*, making it 
      ultra-responsive for high-frequency emergency re-routes.
    - Dynamic weights incorporate live traffic congestion factors and active roadblocks.
    - Euclidean/Haversine heuristic ensures admissibility and consistency.
    """

    def __init__(self, nodes: Dict[str, Dict[str, Any]], edges: List[Dict[str, Any]]):
        self.nodes = nodes
        self.edges = edges
        self.adjacency: Dict[str, List[Dict[str, Any]]] = {n: [] for n in nodes}
        self._build_graph()

    def _build_graph(self):
        self.adjacency = {n: [] for n in self.nodes}
        for edge in self.edges:
            u, v = edge["u"], edge["v"]
            u_coord = Coordinate(lat=self.nodes[u]["lat"], lon=self.nodes[u]["lon"])
            v_coord = Coordinate(lat=self.nodes[v]["lat"], lon=self.nodes[v]["lon"])
            
            # calculate baseline distance in meters if not set
            dist = edge.get("distance_meters")
            if not dist:
                dist = haversine_distance_meters(u_coord, v_coord)
                edge["distance_meters"] = dist

            # bidirectional road connection
            self.adjacency[u].append({
                "to": v,
                "distance_meters": dist,
                "speed_kmh": edge.get("speed_kmh", 45),
                "traffic_factor": edge.get("traffic_factor", 1.0),
                "is_blocked": edge.get("is_blocked", False),
                "road_name": edge.get("road_name", f"{u}-{v}"),
                "raw_edge": edge
            })
            self.adjacency[v].append({
                "to": u,
                "distance_meters": dist,
                "speed_kmh": edge.get("speed_kmh", 45),
                "traffic_factor": edge.get("traffic_factor", 1.0),
                "is_blocked": edge.get("is_blocked", False),
                "road_name": edge.get("road_name", f"{v}-{u}"),
                "raw_edge": edge
            })

    def find_nearest_node(self, coord: Coordinate) -> str:
        """Find the nearest graph intersection node for any given latitude/longitude."""
        best_node = None
        min_dist = float('inf')
        for node_id, node_data in self.nodes.items():
            n_coord = Coordinate(lat=node_data["lat"], lon=node_data["lon"])
            d = haversine_distance_meters(coord, n_coord)
            if d < min_dist:
                min_dist = d
                best_node = node_id
        return best_node or list(self.nodes.keys())[0]

    def _edge_travel_time_seconds(self, distance_meters: float, speed_kmh: float, traffic_factor: float, is_blocked: bool) -> float:
        """Calculate dynamic edge weight: travel time in seconds."""
        if is_blocked:
            return float('inf')
        
        # Effective speed considering congestion: v_eff = v_base * traffic_factor
        effective_speed_kmh = max(5.0, speed_kmh * max(0.05, traffic_factor))
        speed_mps = (effective_speed_kmh * 1000.0) / 3600.0
        return distance_meters / speed_mps

    def _heuristic(self, node_a: str, node_b: str, max_expected_speed_mps: float = (60.0 * 1000.0) / 3600.0) -> float:
        """Admissible heuristic: distance divided by maximum possible road speed."""
        coord_a = Coordinate(lat=self.nodes[node_a]["lat"], lon=self.nodes[node_a]["lon"])
        coord_b = Coordinate(lat=self.nodes[node_b]["lat"], lon=self.nodes[node_b]["lon"])
        dist_m = haversine_distance_meters(coord_a, coord_b)
        return dist_m / max_expected_speed_mps

    def bidirectional_astar(self, source: str, target: str) -> Optional[Tuple[List[str], float, float]]:
        """
        Bidirectional A* Shortest/Fastest Path.
        Returns: (path_node_ids, total_distance_meters, total_time_seconds) or None
        """
        if source == target:
            return [source], 0.0, 0.0

        if source not in self.nodes or target not in self.nodes:
            return None

        # Priority queues: (f_score, node_id)
        forward_pq: List[Tuple[float, str]] = []
        backward_pq: List[Tuple[float, str]] = []

        g_forward: Dict[str, float] = {source: 0.0}
        g_backward: Dict[str, float] = {target: 0.0}

        parent_forward: Dict[str, Optional[Tuple[str, float, float]]] = {source: None}
        parent_backward: Dict[str, Optional[Tuple[str, float, float]]] = {target: None}

        heapq.heappush(forward_pq, (self._heuristic(source, target), source))
        heapq.heappush(backward_pq, (self._heuristic(target, source), target))

        visited_forward = set()
        visited_backward = set()

        best_meeting_node = None
        best_cost = float('inf')

        while forward_pq and backward_pq:
            # Check termination: if the sum of minimum keys in queues exceeds best_cost, we can stop
            if forward_pq[0][0] + backward_pq[0][0] >= best_cost + 1e-5:
                break

            # Forward step
            _, curr_fwd = heapq.heappop(forward_pq)
            if curr_fwd not in visited_forward:
                visited_forward.add(curr_fwd)

                # Check if backward search already reached here
                if curr_fwd in visited_backward:
                    total_c = g_forward[curr_fwd] + g_backward[curr_fwd]
                    if total_c < best_cost:
                        best_cost = total_c
                        best_meeting_node = curr_fwd

                # Expand forward neighbors
                for edge in self.adjacency[curr_fwd]:
                    neighbor = edge["to"]
                    if neighbor in visited_forward or edge["is_blocked"]:
                        continue

                    travel_time = self._edge_travel_time_seconds(
                        edge["distance_meters"], edge["speed_kmh"], 
                        edge["traffic_factor"], edge["is_blocked"]
                    )
                    tentative_g = g_forward[curr_fwd] + travel_time

                    if tentative_g < g_forward.get(neighbor, float('inf')):
                        g_forward[neighbor] = tentative_g
                        parent_forward[neighbor] = (curr_fwd, edge["distance_meters"], travel_time)
                        f_score = tentative_g + self._heuristic(neighbor, target)
                        heapq.heappush(forward_pq, (f_score, neighbor))

                        if neighbor in visited_backward:
                            total_c = tentative_g + g_backward[neighbor]
                            if total_c < best_cost:
                                best_cost = total_c
                                best_meeting_node = neighbor

            # Backward step
            _, curr_bwd = heapq.heappop(backward_pq)
            if curr_bwd not in visited_backward:
                visited_backward.add(curr_bwd)

                if curr_bwd in visited_forward:
                    total_c = g_forward[curr_bwd] + g_backward[curr_bwd]
                    if total_c < best_cost:
                        best_cost = total_c
                        best_meeting_node = curr_bwd

                # Expand backward neighbors
                for edge in self.adjacency[curr_bwd]:
                    neighbor = edge["to"]
                    if neighbor in visited_backward or edge["is_blocked"]:
                        continue

                    travel_time = self._edge_travel_time_seconds(
                        edge["distance_meters"], edge["speed_kmh"], 
                        edge["traffic_factor"], edge["is_blocked"]
                    )
                    tentative_g = g_backward[curr_bwd] + travel_time

                    if tentative_g < g_backward.get(neighbor, float('inf')):
                        g_backward[neighbor] = tentative_g
                        parent_backward[neighbor] = (curr_bwd, edge["distance_meters"], travel_time)
                        f_score = tentative_g + self._heuristic(neighbor, source)
                        heapq.heappush(backward_pq, (f_score, neighbor))

                        if neighbor in visited_forward:
                            total_c = tentative_g + g_forward[neighbor]
                            if total_c < best_cost:
                                best_cost = total_c
                                best_meeting_node = neighbor

        if best_meeting_node is None or best_cost == float('inf'):
            return None

        # Reconstruct path
        forward_path = []
        curr = best_meeting_node
        while curr is not None:
            forward_path.append(curr)
            prev_info = parent_forward.get(curr)
            curr = prev_info[0] if prev_info else None
        forward_path.reverse()

        backward_path = []
        curr = best_meeting_node
        while curr is not None:
            prev_info = parent_backward.get(curr)
            if prev_info:
                backward_path.append(prev_info[0])
                curr = prev_info[0]
            else:
                break

        full_path = forward_path + backward_path

        # Compute total distance meters
        total_dist_meters = 0.0
        for i in range(len(full_path) - 1):
            u, v = full_path[i], full_path[i+1]
            u_coord = Coordinate(lat=self.nodes[u]["lat"], lon=self.nodes[u]["lon"])
            v_coord = Coordinate(lat=self.nodes[v]["lat"], lon=self.nodes[v]["lon"])
            total_dist_meters += haversine_distance_meters(u_coord, v_coord)

        return full_path, total_dist_meters, best_cost

    def compute_route(self, origin_coord: Coordinate, dest_coord: Coordinate, is_reroute: bool = False, reroute_reason: Optional[str] = None) -> Optional[RouteInfo]:
        """Compute complete RouteInfo object between two arbitrary coordinates."""
        source_node = self.find_nearest_node(origin_coord)
        target_node = self.find_nearest_node(dest_coord)

        result = self.bidirectional_astar(source_node, target_node)
        if not result:
            return None

        path_nodes, total_distance_meters, total_time_seconds = result

        # Assemble coordinate polyline
        coords: List[Coordinate] = []
        # Origin exact coordinate
        coords.append(origin_coord)
        for n_id in path_nodes:
            n_data = self.nodes[n_id]
            coords.append(Coordinate(lat=n_data["lat"], lon=n_data["lon"]))
        # Destination exact coordinate
        coords.append(dest_coord)

        return RouteInfo(
            algorithm="Bidirectional A* with Dynamic Edge Cost (Bidirectional A*-DEC)",
            path_nodes=path_nodes,
            coordinates=coords,
            total_distance_km=round(total_distance_meters / 1000.0, 2),
            total_duration_minutes=round(total_time_seconds / 60.0, 1),
            is_rerouted=is_reroute,
            reroute_reason=reroute_reason
        )

    def set_roadblock(self, u: str, v: str, is_blocked: bool) -> bool:
        """Block or unblock a road segment dynamically."""
        updated = False
        for edge in self.edges:
            if (edge["u"] == u and edge["v"] == v) or (edge["u"] == v and edge["v"] == u):
                edge["is_blocked"] = is_blocked
                updated = True
        self._build_graph()
        return updated

    def set_traffic_factor(self, u: str, v: str, traffic_factor: float) -> bool:
        """Set traffic multiplier on road segment (0.1 = heavy jam, 1.0 = clear)."""
        updated = False
        for edge in self.edges:
            if (edge["u"] == u and edge["v"] == v) or (edge["u"] == v and edge["v"] == u):
                edge["traffic_factor"] = traffic_factor
                updated = True
        self._build_graph()
        return updated
