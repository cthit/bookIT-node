import type { GraphQLResolveInfo } from 'graphql';
import type { Context } from '../utils/commonTypes';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Error = {
  __typename?: 'Error';
  sv: Scalars['String']['output'];
  en: Scalars['String']['output'];
};

export type Event = {
  __typename?: 'Event';
  id?: Maybe<Scalars['String']['output']>;
  start: Scalars['String']['output'];
  end: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  created_at?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['String']['output']>;
  room: Array<Room>;
  phone?: Maybe<Scalars['String']['output']>;
  booked_as: Scalars['String']['output'];
  booked_by: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  events?: Maybe<Array<Maybe<Event>>>;
  event?: Maybe<Event>;
  eventsFT?: Maybe<Array<Maybe<Event>>>;
  illegalSlots?: Maybe<Array<IllegalSlot>>;
  rules?: Maybe<Array<Maybe<Rule>>>;
  rule?: Maybe<Rule>;
  user?: Maybe<User>;
};


export type QueryEventArgs = {
  id: Scalars['String']['input'];
};


export type QueryEventsFtArgs = {
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryIllegalSlotsArgs = {
  from: Scalars['String']['input'];
  to: Scalars['String']['input'];
};


export type QueryRuleArgs = {
  id: Scalars['String']['input'];
};

export type InputEvent = {
  id?: InputMaybe<Scalars['String']['input']>;
  start: Scalars['String']['input'];
  end: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  created_at?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['String']['input']>;
  room: Array<Room>;
  phone?: InputMaybe<Scalars['String']['input']>;
  booked_as: Scalars['String']['input'];
  booking_terms: Scalars['Boolean']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createEvent?: Maybe<Error>;
  editEvent?: Maybe<Error>;
  deleteEvent?: Maybe<Error>;
  createRule?: Maybe<Error>;
  deleteRule?: Maybe<Error>;
};


export type MutationCreateEventArgs = {
  event: InputEvent;
};


export type MutationEditEventArgs = {
  event: InputEvent;
};


export type MutationDeleteEventArgs = {
  id: Scalars['String']['input'];
};


export type MutationCreateRuleArgs = {
  rule: InputRule;
};


export type MutationDeleteRuleArgs = {
  id: Scalars['String']['input'];
};

export type IllegalSlot = {
  __typename?: 'IllegalSlot';
  room: Array<Room>;
  start: Scalars['String']['output'];
  end: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type Room =
  | 'BIG_HUB'
  | 'GROUP_ROOM'
  | 'CTC'
  | 'THE_CLOUD';

export type Rule = {
  __typename?: 'Rule';
  id?: Maybe<Scalars['String']['output']>;
  day_mask?: Maybe<Scalars['Int']['output']>;
  start_date?: Maybe<Scalars['String']['output']>;
  end_date?: Maybe<Scalars['String']['output']>;
  start_time?: Maybe<Scalars['String']['output']>;
  end_time?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  allow?: Maybe<Scalars['Boolean']['output']>;
  priority?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['String']['output']>;
  room?: Maybe<Array<Room>>;
};

export type InputRule = {
  id?: InputMaybe<Scalars['String']['input']>;
  day_mask?: InputMaybe<Scalars['Int']['input']>;
  start_date: Scalars['String']['input'];
  end_date: Scalars['String']['input'];
  start_time: Scalars['String']['input'];
  end_time: Scalars['String']['input'];
  description: Scalars['String']['input'];
  allow?: InputMaybe<Scalars['Boolean']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  title: Scalars['String']['input'];
  created_at?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['String']['input']>;
  room: Array<Room>;
};

export type User = {
  __typename?: 'User';
  sub?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  nickname?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  cid?: Maybe<Scalars['String']['output']>;
  groups?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  is_admin?: Maybe<Scalars['Boolean']['output']>;
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
  Error: ResolverTypeWrapper<Error>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Event: ResolverTypeWrapper<Event>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  InputEvent: InputEvent;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  IllegalSlot: ResolverTypeWrapper<IllegalSlot>;
  Room: Room;
  Rule: ResolverTypeWrapper<Rule>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  InputRule: InputRule;
  User: ResolverTypeWrapper<User>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Error: Error;
  String: Scalars['String']['output'];
  Event: Event;
  Query: Record<PropertyKey, never>;
  InputEvent: InputEvent;
  Boolean: Scalars['Boolean']['output'];
  Mutation: Record<PropertyKey, never>;
  IllegalSlot: IllegalSlot;
  Rule: Rule;
  Int: Scalars['Int']['output'];
  InputRule: InputRule;
  User: User;
};

export type ErrorResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Error'] = ResolversParentTypes['Error']> = {
  sv?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  en?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type EventResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = {
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  start?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  end?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  created_at?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updated_at?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  room?: Resolver<Array<ResolversTypes['Room']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  booked_as?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  booked_by?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  events?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType>;
  event?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<QueryEventArgs, 'id'>>;
  eventsFT?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType, RequireFields<QueryEventsFtArgs, 'from' | 'to'>>;
  illegalSlots?: Resolver<Maybe<Array<ResolversTypes['IllegalSlot']>>, ParentType, ContextType, RequireFields<QueryIllegalSlotsArgs, 'from' | 'to'>>;
  rules?: Resolver<Maybe<Array<Maybe<ResolversTypes['Rule']>>>, ParentType, ContextType>;
  rule?: Resolver<Maybe<ResolversTypes['Rule']>, ParentType, ContextType, RequireFields<QueryRuleArgs, 'id'>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
};

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  createEvent?: Resolver<Maybe<ResolversTypes['Error']>, ParentType, ContextType, RequireFields<MutationCreateEventArgs, 'event'>>;
  editEvent?: Resolver<Maybe<ResolversTypes['Error']>, ParentType, ContextType, RequireFields<MutationEditEventArgs, 'event'>>;
  deleteEvent?: Resolver<Maybe<ResolversTypes['Error']>, ParentType, ContextType, RequireFields<MutationDeleteEventArgs, 'id'>>;
  createRule?: Resolver<Maybe<ResolversTypes['Error']>, ParentType, ContextType, RequireFields<MutationCreateRuleArgs, 'rule'>>;
  deleteRule?: Resolver<Maybe<ResolversTypes['Error']>, ParentType, ContextType, RequireFields<MutationDeleteRuleArgs, 'id'>>;
};

export type IllegalSlotResolvers<ContextType = Context, ParentType extends ResolversParentTypes['IllegalSlot'] = ResolversParentTypes['IllegalSlot']> = {
  room?: Resolver<Array<ResolversTypes['Room']>, ParentType, ContextType>;
  start?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  end?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type RuleResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Rule'] = ResolversParentTypes['Rule']> = {
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  day_mask?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  start_date?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  end_date?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  start_time?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  end_time?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  allow?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  priority?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  created_at?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updated_at?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  room?: Resolver<Maybe<Array<ResolversTypes['Room']>>, ParentType, ContextType>;
};

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  sub?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nickname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  locale?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  cid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  groups?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  is_admin?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
};

export type Resolvers<ContextType = Context> = {
  Error?: ErrorResolvers<ContextType>;
  Event?: EventResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  IllegalSlot?: IllegalSlotResolvers<ContextType>;
  Rule?: RuleResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};
