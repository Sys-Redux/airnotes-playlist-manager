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
}