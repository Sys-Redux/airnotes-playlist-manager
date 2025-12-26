// Stack = Last In, First Out (LIFO) = Undo/Redo Functionality
// Push=O(1), Pop=O(1), Peek=O(1)

export class Stack<T> {
    private items: T[] = [];
    private maxSize: number;

    constructor(maxSize: number = 50) {
        this.maxSize = maxSize;
    }

    // Push item onto stack
    // If exceeds maxSize, remove bottom(oldest) item
    push(item: T): void {
        if (this.items.length >= this.maxSize) {
            this.items.shift();
        }
        this.items.push(item);
    }

    // Remove & return top item
    pop(): T | undefined {
        return this.items.pop();
    }

    // Return top item without removing
    peek(): T | undefined {
        return this.items[this.items.length - 1];
    }

    // Check if stack is empty
    isEmpty(): boolean {
        return this.items.length === 0;
    }

    // Get current size of stack
    size(): number {
        return this.items.length;
    }

    // Clear the stack
    clear(): void {
        this.items = [];
    }

    // Get all items in stack (for serialization/debugging)
    toArray(): T[] {
        return [...this.items];
    }

    // Create stack from the array (for deserialization)
    static fromArray<T>(items: T[], maxSize?: number): Stack<T> {
        const stack = new Stack<T>(maxSize);
        items.forEach(item => stack.push(item));
        return stack;
    }
}

// Action types for playlist ops
export type PlaylistActionType =
    | 'ADD_SONG'
    | 'REMOVE_SONG'
    | 'MOVE_SONG'
    | 'RENAME_PLAYLIST'
    | 'UPDATE_DESCRIPTION';

// Represents a single playlist action (for undo/redo)
export interface PlaylistAction {
    type: PlaylistActionType;
    playlistId: string;
    timeStamp: Date;
    // Data needed to undo/redo the action
    payload: {
        songId?: string;
        fromPosition?: number;
        toPosition?: number;
        previousValue?: string;
        newValue?: string;
    };
}

// Manages undo/redo stacks for playlist actions
export class UndoRedoManager {
    private undoStack: Stack<PlaylistAction>;
    private redoStack: Stack<PlaylistAction>;

    constructor(maxHistory: number = 50) {
        this.undoStack = new Stack<PlaylistAction>(maxHistory);
        this.redoStack = new Stack<PlaylistAction>(maxHistory);
    }

    // Record new action (this clears redo stack)
    recordAction(action: PlaylistAction): void {
        this.undoStack.push(action);
        this.redoStack.clear();
    }

    // Get action to undo & move it to redo stack
    undo(): PlaylistAction | undefined {
        const action = this.undoStack.pop();
        if (action) {
            this.redoStack.push(action)
        }
        return action;
    }

    // Get action to redo & move it back to the undo stack
    redo(): PlaylistAction | undefined {
        const action = this.redoStack.pop();
        if (action) {
            this.undoStack.push(action);
        }
        return action;
    }

    // Check if undo is possible
    canUndo(): boolean {
        return !this.undoStack.isEmpty();
    }

    // Check if redo is possible
    canRedo(): boolean {
        return !this.redoStack.isEmpty();
    }

    // Get undo history
    getUndoHistory(): PlaylistAction[] {
        return this.undoStack.toArray().reverse();
    }

    // Get redo history
    getRedoHistory(): PlaylistAction[] {
        return this.redoStack.toArray().reverse();
    }

    // Clear all history
    clearHistory(): void {
        this.undoStack.clear();
        this.redoStack.clear();
    }
}