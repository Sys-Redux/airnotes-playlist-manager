import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { User as UserModel, Playlist as PlaylistModel, Song as SongModel, PlaylistSong as PlaylistSongModel } from '@prisma/client';
import { GraphQLContext } from '@/graphql/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type CreatePlaylistInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};

export type CreatePlaylistResponse = {
  __typename?: 'CreatePlaylistResponse';
  code: Scalars['Int']['output'];
  message: Scalars['String']['output'];
  playlist?: Maybe<Playlist>;
  success: Scalars['Boolean']['output'];
};

export type CreateSongInput = {
  album?: InputMaybe<Scalars['String']['input']>;
  artist: Scalars['String']['input'];
  duration: Scalars['Int']['input'];
  genre?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  releaseDate?: InputMaybe<Scalars['DateTime']['input']>;
  title: Scalars['String']['input'];
};

export type CreateSongResponse = {
  __typename?: 'CreateSongResponse';
  code: Scalars['Int']['output'];
  message: Scalars['String']['output'];
  song?: Maybe<Song>;
  success: Scalars['Boolean']['output'];
};

/** Input for creating a new user. */
export type CreateUserInput = {
  email: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type CreateUserResponse = {
  __typename?: 'CreateUserResponse';
  code: Scalars['Int']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  user?: Maybe<User>;
};

/** Base Mutation type */
export type Mutation = {
  __typename?: 'Mutation';
  /** Health check */
  _health: Scalars['String']['output'];
  /** Add a Song to the end of a playlist */
  addSongToPlaylist: Playlist;
  /** Add a Song to a specific position in a playlist */
  addSongToPlaylistAtPosition: Playlist;
  /** Create a Playlist */
  createPlaylist: CreatePlaylistResponse;
  /** Create a song */
  createSong: CreateSongResponse;
  /** Create User */
  createUser: CreateUserResponse;
  /** Delete a Playlist by ID */
  deletePlaylist: Scalars['Boolean']['output'];
  /** Delete a song by ID */
  deleteSong: Scalars['Boolean']['output'];
  /** Remove a Song from a playlist */
  removeSongFromPlaylist: Playlist;
  /** Update User Preferences */
  setUserPreferences: User;
  /** Update a playlist's name or description */
  updatePlaylist: Playlist;
};


/** Base Mutation type */
export type MutationAddSongToPlaylistArgs = {
  playlistId: Scalars['ID']['input'];
  songId: Scalars['ID']['input'];
};


/** Base Mutation type */
export type MutationAddSongToPlaylistAtPositionArgs = {
  playlistId: Scalars['ID']['input'];
  position: Scalars['Int']['input'];
  songId: Scalars['ID']['input'];
};


/** Base Mutation type */
export type MutationCreatePlaylistArgs = {
  input: CreatePlaylistInput;
};


/** Base Mutation type */
export type MutationCreateSongArgs = {
  input: CreateSongInput;
};


/** Base Mutation type */
export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


/** Base Mutation type */
export type MutationDeletePlaylistArgs = {
  id: Scalars['ID']['input'];
};


/** Base Mutation type */
export type MutationDeleteSongArgs = {
  id: Scalars['ID']['input'];
};


/** Base Mutation type */
export type MutationRemoveSongFromPlaylistArgs = {
  playlistId: Scalars['ID']['input'];
  songId: Scalars['ID']['input'];
};


/** Base Mutation type */
export type MutationSetUserPreferencesArgs = {
  preferences: UpdateUserPreferencesInput;
  userId: Scalars['ID']['input'];
};


/** Base Mutation type */
export type MutationUpdatePlaylistArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePlaylistInput;
};

/**
 * Playlist represents a collection of songs created by a user.
 * Supports hierarchical structure (parent/child) for binary tree operations.
 */
export type Playlist = {
  __typename?: 'Playlist';
  children: Array<Playlist>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  parent?: Maybe<Playlist>;
  /** Songs in this Playlist with their positions */
  song: Array<PlaylistSong>;
  updatedAt: Scalars['DateTime']['output'];
  /** User owns this Playlist */
  user: User;
};

/** Junction representing Song's membership in a Playlist with position */
export type PlaylistSong = {
  __typename?: 'PlaylistSong';
  addedAt: Scalars['DateTime']['output'];
  position: Scalars['Int']['output'];
  song: Song;
};

/** Base Query type - extended by prisma models */
export type Query = {
  __typename?: 'Query';
  /** Health check */
  _health: Scalars['String']['output'];
  /** Get Playlist by ID */
  playlist?: Maybe<Playlist>;
  /** Get all Playlists for a User */
  playlists: Array<Playlist>;
  /** Search songs by query string & optional criteria */
  searchSongs: Array<Song>;
  /** Get song by ID */
  song?: Maybe<Song>;
  /** Get all songs with optional pagination */
  songs: Array<Song>;
  /** Get User by ID */
  user?: Maybe<User>;
  /** Get a user's preferences */
  userPreferences?: Maybe<Scalars['JSON']['output']>;
};


/** Base Query type - extended by prisma models */
export type QueryPlaylistArgs = {
  id: Scalars['ID']['input'];
};


/** Base Query type - extended by prisma models */
export type QueryPlaylistsArgs = {
  userId: Scalars['ID']['input'];
};


/** Base Query type - extended by prisma models */
export type QuerySearchSongsArgs = {
  criteria?: InputMaybe<SearchCriteriaInput>;
  query: Scalars['String']['input'];
};


/** Base Query type - extended by prisma models */
export type QuerySongArgs = {
  id: Scalars['ID']['input'];
};


/** Base Query type - extended by prisma models */
export type QuerySongsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


/** Base Query type - extended by prisma models */
export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


/** Base Query type - extended by prisma models */
export type QueryUserPreferencesArgs = {
  userId: Scalars['ID']['input'];
};

export type SearchCriteriaInput = {
  album?: InputMaybe<Scalars['String']['input']>;
  artist?: InputMaybe<Scalars['String']['input']>;
  genre?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Song represents a musical track in airnotes */
export type Song = {
  __typename?: 'Song';
  album?: Maybe<Scalars['String']['output']>;
  artist: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** Duration in seconds */
  duration: Scalars['Int']['output'];
  genre?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** Flexible field for additional metadata */
  metadata?: Maybe<Scalars['JSON']['output']>;
  releaseDate?: Maybe<Scalars['DateTime']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type UpdatePlaylistInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserPreferencesInput = {
  favoriteArtists?: InputMaybe<Array<Scalars['String']['input']>>;
  favoriteGenres?: InputMaybe<Array<Scalars['String']['input']>>;
  playbackSettings?: InputMaybe<Scalars['JSON']['input']>;
};

/** User represents a registered user of airnotes */
export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  playlists: Array<Playlist>;
  preferences?: Maybe<Scalars['JSON']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CreatePlaylistInput: CreatePlaylistInput;
  CreatePlaylistResponse: ResolverTypeWrapper<Omit<CreatePlaylistResponse, 'playlist'> & { playlist?: Maybe<ResolversTypes['Playlist']> }>;
  CreateSongInput: CreateSongInput;
  CreateSongResponse: ResolverTypeWrapper<Omit<CreateSongResponse, 'song'> & { song?: Maybe<ResolversTypes['Song']> }>;
  CreateUserInput: CreateUserInput;
  CreateUserResponse: ResolverTypeWrapper<Omit<CreateUserResponse, 'user'> & { user?: Maybe<ResolversTypes['User']> }>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Playlist: ResolverTypeWrapper<PlaylistModel>;
  PlaylistSong: ResolverTypeWrapper<PlaylistSongModel>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  SearchCriteriaInput: SearchCriteriaInput;
  Song: ResolverTypeWrapper<SongModel>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  UpdatePlaylistInput: UpdatePlaylistInput;
  UpdateUserPreferencesInput: UpdateUserPreferencesInput;
  User: ResolverTypeWrapper<UserModel>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  CreatePlaylistInput: CreatePlaylistInput;
  CreatePlaylistResponse: Omit<CreatePlaylistResponse, 'playlist'> & { playlist?: Maybe<ResolversParentTypes['Playlist']> };
  CreateSongInput: CreateSongInput;
  CreateSongResponse: Omit<CreateSongResponse, 'song'> & { song?: Maybe<ResolversParentTypes['Song']> };
  CreateUserInput: CreateUserInput;
  CreateUserResponse: Omit<CreateUserResponse, 'user'> & { user?: Maybe<ResolversParentTypes['User']> };
  DateTime: Scalars['DateTime']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  Mutation: Record<PropertyKey, never>;
  Playlist: PlaylistModel;
  PlaylistSong: PlaylistSongModel;
  Query: Record<PropertyKey, never>;
  SearchCriteriaInput: SearchCriteriaInput;
  Song: SongModel;
  String: Scalars['String']['output'];
  UpdatePlaylistInput: UpdatePlaylistInput;
  UpdateUserPreferencesInput: UpdateUserPreferencesInput;
  User: UserModel;
};

export type CreatePlaylistResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CreatePlaylistResponse'] = ResolversParentTypes['CreatePlaylistResponse']> = {
  code?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  playlist?: Resolver<Maybe<ResolversTypes['Playlist']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type CreateSongResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CreateSongResponse'] = ResolversParentTypes['CreateSongResponse']> = {
  code?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  song?: Resolver<Maybe<ResolversTypes['Song']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type CreateUserResponseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CreateUserResponse'] = ResolversParentTypes['CreateUserResponse']> = {
  code?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  _health?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  addSongToPlaylist?: Resolver<ResolversTypes['Playlist'], ParentType, ContextType, RequireFields<MutationAddSongToPlaylistArgs, 'playlistId' | 'songId'>>;
  addSongToPlaylistAtPosition?: Resolver<ResolversTypes['Playlist'], ParentType, ContextType, RequireFields<MutationAddSongToPlaylistAtPositionArgs, 'playlistId' | 'position' | 'songId'>>;
  createPlaylist?: Resolver<ResolversTypes['CreatePlaylistResponse'], ParentType, ContextType, RequireFields<MutationCreatePlaylistArgs, 'input'>>;
  createSong?: Resolver<ResolversTypes['CreateSongResponse'], ParentType, ContextType, RequireFields<MutationCreateSongArgs, 'input'>>;
  createUser?: Resolver<ResolversTypes['CreateUserResponse'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  deletePlaylist?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeletePlaylistArgs, 'id'>>;
  deleteSong?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteSongArgs, 'id'>>;
  removeSongFromPlaylist?: Resolver<ResolversTypes['Playlist'], ParentType, ContextType, RequireFields<MutationRemoveSongFromPlaylistArgs, 'playlistId' | 'songId'>>;
  setUserPreferences?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationSetUserPreferencesArgs, 'preferences' | 'userId'>>;
  updatePlaylist?: Resolver<ResolversTypes['Playlist'], ParentType, ContextType, RequireFields<MutationUpdatePlaylistArgs, 'id' | 'input'>>;
};

export type PlaylistResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Playlist'] = ResolversParentTypes['Playlist']> = {
  children?: Resolver<Array<ResolversTypes['Playlist']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  parent?: Resolver<Maybe<ResolversTypes['Playlist']>, ParentType, ContextType>;
  song?: Resolver<Array<ResolversTypes['PlaylistSong']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
};

export type PlaylistSongResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PlaylistSong'] = ResolversParentTypes['PlaylistSong']> = {
  addedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  position?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  song?: Resolver<ResolversTypes['Song'], ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _health?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  playlist?: Resolver<Maybe<ResolversTypes['Playlist']>, ParentType, ContextType, RequireFields<QueryPlaylistArgs, 'id'>>;
  playlists?: Resolver<Array<ResolversTypes['Playlist']>, ParentType, ContextType, RequireFields<QueryPlaylistsArgs, 'userId'>>;
  searchSongs?: Resolver<Array<ResolversTypes['Song']>, ParentType, ContextType, RequireFields<QuerySearchSongsArgs, 'query'>>;
  song?: Resolver<Maybe<ResolversTypes['Song']>, ParentType, ContextType, RequireFields<QuerySongArgs, 'id'>>;
  songs?: Resolver<Array<ResolversTypes['Song']>, ParentType, ContextType, Partial<QuerySongsArgs>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
  userPreferences?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType, RequireFields<QueryUserPreferencesArgs, 'userId'>>;
};

export type SongResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Song'] = ResolversParentTypes['Song']> = {
  album?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  artist?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  duration?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  genre?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  metadata?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  releaseDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
};

export type UserResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  playlists?: Resolver<Array<ResolversTypes['Playlist']>, ParentType, ContextType>;
  preferences?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
};

export type Resolvers<ContextType = GraphQLContext> = {
  CreatePlaylistResponse?: CreatePlaylistResponseResolvers<ContextType>;
  CreateSongResponse?: CreateSongResponseResolvers<ContextType>;
  CreateUserResponse?: CreateUserResponseResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  JSON?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Playlist?: PlaylistResolvers<ContextType>;
  PlaylistSong?: PlaylistSongResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Song?: SongResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};

