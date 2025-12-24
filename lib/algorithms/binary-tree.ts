// Binary Tree -- Supports various traversal methods to navigate nested
// playlists & aggregate song information.

export interface TreeNode<T> {
    id: string;
    data: T;
    left: TreeNode<T> | null;
    right: TreeNode<T> | null;
}

export interface TraversalResult<T> {
    nodes: T[];
    depth: number;
    totalNodes: number;
}

export class BinaryTree<T> {
    root: TreeNode<T> | null = null;

    constructor(rootData?: { id: string; data: T }) {
        if (rootData) {
            this.root = { id: rootData.id, data: rootData.data, left: null, right: null };
        }
    }

    insert(parentId: string, nodeId: string, data: T): boolean {
        const parent = this.findNode(this.root, parentId);
        if (!parent) return false;

        const newNode: TreeNode<T> = { id: nodeId, data, left: null, right: null };

        // If no left child, insert there
        if (!parent.left) {
            parent.left = newNode;
            // Otherwise, traverse right siblings & add at the end
        } else {
            let sibling = parent.left;
            while (sibling.right) {
                sibling = sibling.right;
            }
            sibling.right = newNode;
        }
        return true;
    }

    findNode(node: TreeNode<T> | null, id: string): TreeNode<T> | null {
        if (!node) return null;
        if (node.id === id) return node;

        // Search left subtree
        const leftResult = this.findNode(node.left, id);
        if (leftResult) return leftResult;

        // Search right siblings
        return this.findNode(node.right, id);
    }

    // Pre-Order Traversal: Root -> Left -> Right
    // Useful for displaying top-down hierarchy
    preOrderTraversal(node: TreeNode<T> | null = this.root, result: T[] = []): T[] {
        if (!node) return result;
        result.push(node.data);
        this.preOrderTraversal(node.left, result);
        this.preOrderTraversal(node.right, result);
        return result;
    }

    // In-Order Traversal: Left -> Root -> Right
    // Useful for sorted output in binary search trees
    inOrderTraversal(node: TreeNode<T> | null = this.root, result: T[] = []): T[] {
        if (!node) return result;
        this.inOrderTraversal(node.left, result);
        result.push(node.data);
        this.inOrderTraversal(node.right, result);
        return result;
    }

    // Post-Order Traversal: Left -> Right -> Root
    // Useful for bootom-up processing like calculating total songs
    postOrderTraversal(node: TreeNode<T> | null = this.root, result: T[] = []): T[] {
        if (!node) return result;
        this.postOrderTraversal(node.left, result);
        this.postOrderTraversal(node.right, result);
        result.push(node.data);
        return result;
    }

    // Level-Order Traversal (BFS): level by level
    // Useful for displaying hierarchy breadth-first
    levelOrderTraversal(node: TreeNode<T> | null = this.root): T[] {
        if (!node) return [];

        const result: T[] = [];
        const queue: TreeNode<T>[] = [node];

        while (queue.length > 0) {
            const current = queue.shift()!;
            result.push(current.data);

            if (current.left) queue.push(current.left);
            if (current.right) queue.push(current.right);
        }
        return result;
    }

    // Get all descendants of a node (children only, not siblings)
    getDescendants(nodeId: string): T[] {
        const node = this.findNode(this.root, nodeId);
        if (!node || !node.left) return [];
        // Get all nodes under the left child (and their siblings)
        return this.levelOrderTraversal(node.left);
    }

    // Collect a node, all its siblings, and their descendants
    private collectChildren(node: TreeNode<T> | null, result: T[] = []): T[] {
        if (!node) return result;
        result.push(node.data);
        this.collectChildren(node.left, result); // Children
        this.collectChildren(node.right, result); // Siblings
        return result;
    }

    // Calculate depth of tree
    getDepth(node: TreeNode<T> | null = this.root): number {
        if (!node) return 0;

        const leftDepth = this.getDepth(node.left);
        const rightDepth = this.getDepth(node.right);

        return Math.max(leftDepth, rightDepth) + 1;
    }

    // Count total nodes in tree
    countNodes(node: TreeNode<T> | null = this.root): number {
        if (!node) return 0;
        return 1 + this.countNodes(node.left) + this.countNodes(node.right);
    }
}

// =========================================================================
// TRAVERSAL ORDER OPTIONS
// =========================================================================

export type TraversalOrder = 'preOrder' | 'inOrder' | 'postOrder' | 'levelOrder';

export function buildPlaylistTree<T extends { id: string; parentId: string | null }>(
    playlists: T[],
    rootId: string
): BinaryTree<T> {
    const tree = new BinaryTree<T>();

    // Find root (no parent or specified rootId)
    const root = rootId
        ? playlists.find(p => p.id === rootId)
        : playlists.find(p => p.parentId === null);

    if (!root) return tree;

    tree.root = { id: root.id, data: root, left: null, right: null };

    // Build tree recursively
    const addChildren = (parentNode: TreeNode<T>) => {
        const children = playlists.filter(p => p.parentId === parentNode.id);

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childNode: TreeNode<T> = { id: child.id, data: child, left: null, right: null };

            if (i === 0) {
                parentNode.left = childNode;
            } else {
                let sibling = parentNode.left!;
                while (sibling.right) {
                    sibling = sibling.right;
                }
                sibling.right = childNode;
            }
            addChildren(childNode);
        }
    };
    addChildren(tree.root);
    return tree;
}