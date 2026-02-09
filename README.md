<!-- markdownlint-disable -->

# 🎵 AirNotes

A dynamic playlist management API that helps users organize, navigate, and explore their music collections. Built with a modern GraphQL-first approach, featuring data structures and algorithms for intelligent playlist operations.Indie music focused.

[![GitHub](https://img.shields.io/badge/GitHub-Sys--Redux-181717?style=for-the-badge&logo=github)](https://github.com/Sys-Redux)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-t--edge-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/t-edge/)
[![Website](https://img.shields.io/badge/Website-sysredux.xyz-FF5722?style=for-the-badge&logo=googlechrome&logoColor=white)](https://www.sysredux.xyz)
[![X](https://img.shields.io/badge/X-sys__redux-000000?style=for-the-badge&logo=x)](https://x.com/sys_redux)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/KdfApwrBuW)
[![Upwork](https://img.shields.io/badge/Upwork-Hire%20Me-6FDA44?style=for-the-badge&logo=upwork&logoColor=white)](https://www.upwork.com/freelancers/~011b4cf7ebf1503859?mp_source=share)
[![Freelancer](https://img.shields.io/badge/Freelancer-trevoredge-29B2FE?style=for-the-badge&logo=freelancer&logoColor=white)](https://www.freelancer.com/u/trevoredge?frm=trevoredge&sb=t)

---

## 🚀 Features

### Core API Operations

- **Users** - Create users, manage preferences (favorite genres, artists, themes)
- **Songs** - Full CRUD operations with search by title, artist, album, or genre
- **Playlists** - Create, update, delete playlists with song management
- **Playlist Songs** - Add/remove songs with automatic position management

### Algorithm Implementations

- **Dijkstra's Algorithm** - Find the optimal path between two songs based on similarity weights. Perfect for creating smooth transitions in your listening experience.

### GraphQL API

- Schema-first design with Apollo Server
- Type-safe resolvers with auto-generated TypeScript types
- Supports queries, mutations, and field resolvers

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **API** | GraphQL (Schema-first) |
| **Server** | Apollo Server 5 |
| **ORM** | Prisma 7 |
| **Database** | PostgreSQL |
| **Code Generation** | GraphQL Codegen |

---

## 📁 Project Structure

```js
airnotes/
├── app/
│   └── api/graphql/route.ts     # Apollo Server endpoint
├── graphql/
│   ├── schema/                   # GraphQL schema files
│   │   ├── schema.graphql        # Base Query/Mutation types
│   │   ├── user/                 # User types & operations
│   │   ├── song/                 # Song types & operations
│   │   ├── playlist/             # Playlist types & operations
│   │   └── algorithms/           # Algorithm-related types
│   ├── resolvers/                # Resolver implementations
│   │   ├── index.ts              # Merged resolvers
│   │   ├── user.ts
│   │   ├── song.ts
│   │   ├── playlist.ts
│   │   └── dijkstra.ts
│   └── context.ts                # GraphQL context (Prisma)
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── algorithms/               # Data structure implementations
│   │   └── dijkstra.ts           # Dijkstra's shortest path
│   └── generated/                # Auto-generated Prisma client
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Database migrations
│   └── seed.ts                   # Seed data generator
├── types/
│   └── generated/graphql.ts      # Auto-generated GraphQL types
└── notes/                        # Algorithm explanations
```

---

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sys-Redux/airnotes.git
   cd airnotes
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your database connection string:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/airnotes"
   ```

4. **Set up the database**
   ```bash
   pnpm db:generate    # Generate Prisma client
   pnpm db:migrate     # Run migrations
   ```

5. **Seed the database** (optional but recommended)
   ```bash
   npx tsx prisma/seed.ts
   ```

   This creates sample data:
   - 20 users with preferences
   - 250 songs across 10 genres
   - 60 playlists with songs
   - Song connections for pathfinding

6. **Generate GraphQL types**
   ```bash
   pnpm codegen
   ```

7. **Start the development server**
   ```bash
   pnpm dev
   ```

8. **Open Apollo Sandbox**

   Navigate to [http://localhost:3000/api/graphql](http://localhost:3000/api/graphql)

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm dev:all` | Start with auto-reload for schema changes |
| `pnpm build` | Build for production |
| `pnpm codegen` | Generate TypeScript types from GraphQL schema |
| `pnpm codegen:watch` | Watch mode for codegen |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio (database GUI) |

---

## 🔍 Example Queries

### Get a User's Playlists
```graphql
query GetUserPlaylists($userId: ID!) {
  playlists(userId: $userId) {
    id
    name
    description
    song {
      position
      song {
        title
        artist
      }
    }
  }
}
```

### Search Songs
```graphql
query SearchSongs {
  searchSongs(query: "love", criteria: { genre: "Pop" }) {
    id
    title
    artist
    album
    genre
  }
}
```

### Find Shortest Path Between Songs
```graphql
query FindPath {
  shortestPath(
    startSongId: "song-id-1"
    endSongId: "song-id-2"
    constraints: {
      maxHops: 5
      allowedGenres: ["Rock", "Indie", "Alternative"]
    }
  ) {
    found
    totalWeight
    pathLength
    path {
      stepNumber
      cumulativeWeight
      song {
        title
        artist
        genre
      }
    }
  }
}
```

### Create a Playlist
```graphql
mutation CreatePlaylist {
  createPlaylist(input: {
    name: "My Awesome Mix"
    description: "The best songs"
    userId: "user-id-here"
  }) {
    success
    message
    playlist {
      id
      name
    }
  }
}
```

---

## 🧠 Algorithms

### Dijkstra's Shortest Path

The `shortestPath` query uses Dijkstra's algorithm to find the optimal sequence of songs between a start and end song. Songs are connected with weights based on similarity (genre, tempo, mood). Lower weights mean more similar songs.

**Use Case:** Creating smooth transitions in a playlist. Instead of jumping directly from a slow ballad to an upbeat dance track, the algorithm finds intermediate songs that make the transition feel natural.

**Constraints:**
- `maxWeight` - Maximum total "distance" allowed
- `allowedGenres` - Only traverse through specific genres
- `maxHops` - Limit the number of songs in the path

---

## 🗃️ Database Schema

### Core Models
- **User** - Email, name, preferences (JSON)
- **Song** - Title, artist, album, genre, duration, metadata
- **Playlist** - Name, description, owner, hierarchical structure
- **PlaylistSong** - Many-to-many with position ordering

### Algorithm Support
- **SongConnection** - Weighted edges between songs for pathfinding

---

## 🚧 Roadmap

- [ ] Linked List - Dynamic song reordering
- [ ] Stack - Undo/redo for playlist edits
- [ ] Queue - Playback queue management
- [ ] Binary Tree - Hierarchical playlist traversal
- [ ] Binary Search & Quick Sort - Fast playlist navigation
- [ ] React Frontend - Interactive UI

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Sys-Redux/airnotes/issues).

---

Built with ☕ and 🎵
