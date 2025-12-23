// Used to find optimal song sequences based on similarity weights

interface Edge {
    target: string; // Target node ID
    weight: number; // Weight of the edge (lower = more similar)
}

export interface PathResult {
    path: string[]; // Ordered list of node IDs from source to target
    totalWeight: number;
    found: boolean;
}

// Priority queue entry
interface QueueEntry {
    nodeId: string;
    distance: number;
}

class PriorityQueue {
    private heap: QueueEntry[] = [];

    enqueue(nodeId: string, distance: number): void {
        this.heap.push({ nodeId, distance });
        this.bubbleUp(this.heap.length - 1);
    }

    dequeue(): QueueEntry | undefined {
        if (this.isEmpty()) return undefined;

        const min = this.heap[0];
        const last = this.heap.pop()!;

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.bubbleDown(0);
        }
        return min;
    }

    isEmpty(): boolean {
        return this.heap.length == 0;
    }

    private bubbleUp(index: number): void {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[parentIndex].distance <= this.heap[index].distance)
                break;
            [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
            index = parentIndex;
        }
    }

    private bubbleDown(index: number): void {
        const length = this.heap.length;
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let smallest = index;

            if (leftChild < length && this.heap[leftChild].distance < this.heap[smallest].distance) {
                smallest = leftChild;
            }
            if (rightChild < length && this.heap[rightChild].distance < this.heap[smallest].distance) {
                smallest = rightChild;
            }
            if (smallest === index)
                break;

            [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
            index = smallest;
        }
    }
}

export class DijkstraGraph {
    private adjacencyList: Map<string, Edge[]> = new Map();

    addNode(nodeId: string): void {
        if (!this.adjacencyList.has(nodeId)) {
            this.adjacencyList.set(nodeId, []);
        }
    }

    // Directed Edge
    addEdge(source: string, target: string, weight: number): void {
        this.addNode(source);
        this.addNode(target);
        this.adjacencyList.get(source)!.push({ target, weight });
    }

    // Undirected Edge (Both Directions)
    addUndirectedEdge(nodeA: string, nodeB: string, weight: number): void {
        this.addEdge(nodeA, nodeB, weight);
        this.addEdge(nodeB, nodeA, weight);
    }

    // Find Shortest Path
    // Returns PathResult, total weight, and found status
    findShortestPath(startId: string, endId: string, maxWeight?: number): PathResult {
        // Both Nodes Exists?
        if (!this.adjacencyList.has(startId) || !this.adjacencyList.has(endId)) {
            return { path: [], totalWeight: Infinity, found: false };
        }

        // Track shortest known distance to each node
        const distances: Map<string, number> = new Map();
        // Track the previous node in the shortest path
        const previous: Map<string, string | null> = new Map();
        // Track visited nodes
        const visited: Set<string> = new Set();
        // Priority queue for nodes to visit
        const pq = new PriorityQueue();

        // Initialize all distances to infinity (and beyond)
        for (const nodeId of this.adjacencyList.keys()) {
            distances.set(nodeId, Infinity);
            previous.set(nodeId, null);
        }

        distances.set(startId, 0);
        pq.enqueue(startId, 0);

        while (!pq.isEmpty()) {
            const current = pq.dequeue()!;
            const currentId = current.nodeId;

            // Skip if visited
            if (visited.has(currentId))
                continue;
            visited.add(currentId);

            // Found target - reconstruct path
            if (currentId === endId) {
                return this.reconstructPath(startId, endId, distances, previous);
            }
            // Explore neighbors
            const neighbors = this.adjacencyList.get(currentId) || [];
            for (const edge of neighbors) {
                if (visited.has(edge.target))
                    continue;

                const newDistance = distances.get(currentId)! + edge.weight;

                // Skip if exceeds maxWeight
                if (maxWeight !== undefined && newDistance > maxWeight)
                    continue;

                // Found shorter path to neighbor
                if (newDistance < distances.get(edge.target)!) {
                    distances.set(edge.target, newDistance);
                    previous.set(edge.target, currentId);
                    pq.enqueue(edge.target, newDistance);
                }
            }
        }
        // No path found
        return { path: [], totalWeight: Infinity, found: false };
    }

    private reconstructPath(
        startId: string,
        endId: string,
        distances: Map<string, number>,
        previous: Map<string, string | null>
    ): PathResult {
        const path: string[] = [];
        let current: string | null = endId;

        // Backtrack from end to start
        while (current !== null) {
            path.unshift(current);
            current = previous.get(current) || null;
        }

        // Verify path starts with startId node
        if (path[0] !== startId) {
            return { path: [], totalWeight: Infinity, found: false };
        }

        return {
            path,
            totalWeight: distances.get(endId)!,
            found: true,
        };
    }

    getNodes(): string[] {
        return Array.from(this.adjacencyList.keys());
    }

    getEdges(nodeId: string): Edge[] {
        return this.adjacencyList.get(nodeId) || [];
    }
}