// Queue = First In, First Out (FIFO)
// Used for playback queue management
// Enqueue=O(1), Dequeue=O(1), Peek=O(1)

export class Queue<T> {
    private items: T[] = [];
    private head: number = 0; // Track head index

    // Add item to end of queue
    enqueue(item: T): void {
        this.items.push(item);
    }

    // Add multiple items to end of queue
    enqueueMultiple(items: T[]): void {
        this.items.push(...items);
    }

    // Remove & return item from front of queue
    dequeue(): T | undefined {
        if (this.isEmpty()) return undefined;

        const item = this.items[this.head];
        this.head++;

        // Compact array when head gets too far ahead
        if (this.head > 100 && this.head > this.items.length /2) {
            this.items = this.items.slice(this.head);
            this.head = 0;
        }
        return item;
    }

    // Return front item without removing
    peek(): T | undefined {
        if (this.isEmpty()) return undefined;
        return this.items[this.head];
    }

    // Check if queue is empty
    isEmpty(): boolean {
        return this.head >= this.items.length;
    }

    // Get the number of items in queue
    size(): number {
        return this.items.length - this.head;
    }

    // Clear all items from queue
    clear(): void {
        this.items = [];
        this.head = 0;
    }

    // Get all items in queue order (front to back)
    toArray(): T[] {
        return this.items.slice(this.head);
    }

    // Insert item at specific position (0 = front)
    insertAt(index: number, item: T): void {
        const actualIndex = this.head + index;
        if (actualIndex >= this.items.length) {
            this.items.push(item);
        } else {
            this.items.splice(actualIndex, 0, item);
        }
    }

    // Remove an item at specified position
    removeAt(index: number): T | undefined {
        if (index < 0 || index >= this.size()) return undefined;
        const actualIndex = this.head + index;
        return this.items.splice(actualIndex, 1)[0];
    }

    // Move an item from one position to another
    move(fromIndex: number, toIndex: number): boolean {
        if (fromIndex < 0 || fromIndex >= this.size()) return false;
        if (toIndex < 0 || toIndex >= this.size()) return false;

        const item = this.removeAt(fromIndex);
        if (item === undefined) return false;

        this.insertAt(toIndex, item);
        return true;
    }

    // Shuffle queue (Fisher-Yates algorithm)
    shuffle(): void {
        const arr = this.toArray();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        this.items = arr;
        this.head = 0;
    }

    // Create queue from array
    static fromArray<T>(items: T[]): Queue<T> {
        const queue = new Queue<T>();
        queue.enqueueMultiple(items);
        return queue;
    }
}

// Represents a song in playback queue
export interface QueuedSong {
    songId: string;
    addedAt: Date;
    addedBy?: string; // User ID who added the song
}

// Playback Queue Manager w/ additional music-specific features
export class PlaybackQueue {
    private queue: Queue<QueuedSong>;
    private history: QueuedSong[] = []; // Recently played
    private currentSong: QueuedSong | null = null;
    private repeatMode: 'none' | 'one' | 'all' = 'none';
    private maxHistorySize: number;

    constructor(maxHistorySize: number = 100) {
        this.queue = new Queue<QueuedSong>();
        this.maxHistorySize = maxHistorySize;
    }

    // Add song to queue
    addSong(songId: string, addedBy?: string): void {
        this.queue.enqueue({
            songId,
            addedAt: new Date(),
            addedBy,
        });
    }

    // Add multiple songs to queue
    addSongs(songIds: string[], addedBy?: string): void {
        const songs = songIds.map(songId => ({
            songId,
            addedAt: new Date(),
            addedBy,
        }));
        this.queue.enqueueMultiple(songs);
    }

    // Play next song in queue
    next(): QueuedSong | null {
        // Add current song to history
        if (this.currentSong) {
            this.history.push(this.currentSong);
            if (this.history.length > this.maxHistorySize) {
                this.history.shift();
            }
        }
        // Handle repeat modes
        if (this.repeatMode === 'one' && this.currentSong) {
            return this.currentSong;
        }

        const nextSong = this.queue.dequeue();
        if (!nextSong && this.repeatMode === 'all' && this.history.length > 0) {
            // Restart from history
            this.queue.enqueueMultiple(this.history);
            this.history = [];
            this.currentSong = this.queue.dequeue() || null;
        } else {
            this.currentSong = nextSong || null;
        }
        return this.currentSong;
    }

    // Go to previous song
    previous(): QueuedSong | null {
        if (this.history.length === 0) return this.currentSong;

        // Put current song back to front of queue
        if (this.currentSong) {
            this.queue.insertAt(0, this.currentSong);
        }

        // Get last song from history
        this.currentSong = this.history.pop() || null;
        return this.currentSong;
    }

    // Get current song
    getCurrentSong(): QueuedSong | null {
        return this.currentSong;
    }

    // Get upcoming songs
    getUpcoming(limit?: number): QueuedSong[] {
        const all = this.queue.toArray();
        return limit ? all.slice(0, limit) : all;
    }

    // Get recently played
    getHistory(limit?: number): QueuedSong[] {
        const reversed = [...this.history].reverse();
        return limit ? reversed.slice(0, limit) : reversed;
    }

    // Clear queue
    clearQueue(): void {
        this.queue.clear();
    }

    // Shuffle queue
    shuffleQueue(): void {
        this.queue.shuffle();
    }

    // Set repeat mode
    setRepeatMode(mode: 'none' | 'one' | 'all'): void {
        this.repeatMode = mode;
    }

    // Get repeat mode
    getRepeatMode(): 'none' | 'one' | 'all' {
        return this.repeatMode;
    }

    // Get total songs in queue
    queueSize(): number {
        return this.queue.size();
    }

    // Remove a song from queue by index
    removeFromQueue(index: number): QueuedSong | undefined {
        return this.queue.removeAt(index);
    }

    // Move a song within the queue
    moveInQueue(fromIndex: number, toIndex: number): boolean {
        return this.queue.move(fromIndex, toIndex);
    }
}