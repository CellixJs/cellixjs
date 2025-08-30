import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from "graphql";
import type { GraphContext } from "../context.ts";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  AccountNumber: { input: any; output: any };
  BigInt: { input: any; output: any };
  Byte: { input: any; output: any };
  CountryCode: { input: any; output: any };
  CountryName: { input: any; output: any };
  Cuid: { input: any; output: any };
  Currency: { input: any; output: any };
  DID: { input: any; output: any };
  Date: { input: Date; output: Date };
  DateTime: { input: any; output: any };
  DateTimeISO: { input: any; output: any };
  DeweyDecimal: { input: any; output: any };
  Duration: { input: any; output: any };
  EmailAddress: { input: string; output: string };
  GUID: { input: string; output: string };
  GeoJSON: { input: any; output: any };
  HSL: { input: any; output: any };
  HSLA: { input: any; output: any };
  HexColorCode: { input: any; output: any };
  Hexadecimal: { input: any; output: any };
  IBAN: { input: any; output: any };
  IP: { input: any; output: any };
  IPCPatent: { input: any; output: any };
  IPv4: { input: any; output: any };
  IPv6: { input: any; output: any };
  ISBN: { input: any; output: any };
  ISO8601Duration: { input: any; output: any };
  JSON: { input: any; output: any };
  JSONObject: { input: any; output: any };
  JWT: { input: any; output: any };
  LCCSubclass: { input: any; output: any };
  Latitude: { input: any; output: any };
  LocalDate: { input: any; output: any };
  LocalDateTime: { input: any; output: any };
  LocalEndTime: { input: any; output: any };
  LocalTime: { input: any; output: any };
  Locale: { input: any; output: any };
  Long: { input: any; output: any };
  Longitude: { input: any; output: any };
  MAC: { input: any; output: any };
  NegativeFloat: { input: any; output: any };
  NegativeInt: { input: any; output: any };
  NonEmptyString: { input: any; output: any };
  NonNegativeFloat: { input: any; output: any };
  NonNegativeInt: { input: any; output: any };
  NonPositiveFloat: { input: any; output: any };
  NonPositiveInt: { input: any; output: any };
  ObjectID: { input: any; output: any };
  PhoneNumber: { input: any; output: any };
  Port: { input: any; output: any };
  PositiveFloat: { input: any; output: any };
  PositiveInt: { input: any; output: any };
  PostalCode: { input: any; output: any };
  RGB: { input: any; output: any };
  RGBA: { input: any; output: any };
  RoutingNumber: { input: any; output: any };
  SESSN: { input: any; output: any };
  SafeInt: { input: any; output: any };
  SemVer: { input: any; output: any };
  Time: { input: any; output: any };
  TimeZone: { input: any; output: any };
  Timestamp: { input: any; output: any };
  URL: { input: any; output: any };
  USCurrency: { input: any; output: any };
  UUID: { input: any; output: any };
  UnsignedFloat: { input: any; output: any };
  UnsignedInt: { input: any; output: any };
  UtcOffset: { input: any; output: any };
  Void: { input: any; output: any };
};

export type BlobAuthHeader = {
  readonly __typename?: "BlobAuthHeader";
  readonly authHeader?: Maybe<Scalars["String"]["output"]>;
  readonly blobName?: Maybe<Scalars["String"]["output"]>;
  readonly blobPath?: Maybe<Scalars["String"]["output"]>;
  readonly indexTags?: Maybe<ReadonlyArray<Maybe<BlobIndexTag>>>;
  readonly metadataFields?: Maybe<ReadonlyArray<Maybe<BlobMetadataField>>>;
  readonly requestDate?: Maybe<Scalars["String"]["output"]>;
};

export type BlobIndexTag = {
  readonly __typename?: "BlobIndexTag";
  readonly name: Scalars["String"]["output"];
  readonly value: Scalars["String"]["output"];
};

export type BlobMetadataField = {
  readonly __typename?: "BlobMetadataField";
  readonly name: Scalars["String"]["output"];
  readonly value: Scalars["String"]["output"];
};

/**  Required to enable Apollo Cache Control  */
export type CacheControlScope = "PRIVATE" | "PUBLIC";

export type Community = MongoBase & {
  readonly __typename?: "Community";
  readonly createdAt: Scalars["DateTime"]["output"];
  readonly createdBy: EndUser;
  readonly domain?: Maybe<Scalars["String"]["output"]>;
  readonly handle?: Maybe<Scalars["String"]["output"]>;
  readonly id: Scalars["ObjectID"]["output"];
  readonly name: Scalars["String"]["output"];
  readonly publicContentBlobUrl?: Maybe<Scalars["String"]["output"]>;
  readonly schemaVersion: Scalars["String"]["output"];
  readonly updatedAt: Scalars["DateTime"]["output"];
  readonly whiteLabelDomain?: Maybe<Scalars["String"]["output"]>;
};

export type CommunityCreateInput = {
  readonly name: Scalars["String"]["input"];
};

export type CommunityMutationResult = MutationResult & {
  readonly __typename?: "CommunityMutationResult";
  readonly community?: Maybe<Community>;
  readonly status: MutationStatus;
};

export type EndUser = MongoBase & {
  readonly __typename?: "EndUser";
  readonly accessBlocked?: Maybe<Scalars["Boolean"]["output"]>;
  readonly createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  readonly displayName?: Maybe<Scalars["String"]["output"]>;
  readonly externalId?: Maybe<Scalars["String"]["output"]>;
  readonly id: Scalars["ObjectID"]["output"];
  readonly personalInformation?: Maybe<EndUserPersonalInformation>;
  readonly schemaVersion?: Maybe<Scalars["String"]["output"]>;
  readonly tags?: Maybe<ReadonlyArray<Maybe<Scalars["String"]["output"]>>>;
  readonly updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export type EndUserContactInformation = {
  readonly __typename?: "EndUserContactInformation";
  readonly email: Scalars["String"]["output"];
};

export type EndUserIdentityDetails = {
  readonly __typename?: "EndUserIdentityDetails";
  readonly lastName: Scalars["String"]["output"];
  readonly legalNameConsistsOfOneName: Scalars["Boolean"]["output"];
  readonly restOfName?: Maybe<Scalars["String"]["output"]>;
};

export type EndUserPersonalInformation = {
  readonly __typename?: "EndUserPersonalInformation";
  readonly contactInformation?: Maybe<EndUserContactInformation>;
  readonly identityDetails?: Maybe<EndUserIdentityDetails>;
};

export type Member = MongoBase & {
  readonly __typename?: "Member";
  readonly accounts: ReadonlyArray<MemberAccount>;
  readonly community?: Maybe<Community>;
  readonly createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  readonly id: Scalars["ObjectID"]["output"];
  readonly isAdmin?: Maybe<Scalars["Boolean"]["output"]>;
  readonly memberName?: Maybe<Scalars["String"]["output"]>;
  readonly profile?: Maybe<MemberProfile>;
  readonly schemaVersion?: Maybe<Scalars["String"]["output"]>;
  readonly updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export type MemberAccount = MongoSubdocument & {
  readonly __typename?: "MemberAccount";
  readonly createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  readonly createdBy?: Maybe<EndUser>;
  readonly firstName: Scalars["String"]["output"];
  readonly id: Scalars["ObjectID"]["output"];
  readonly lastName?: Maybe<Scalars["String"]["output"]>;
  readonly statusCode?: Maybe<Scalars["String"]["output"]>;
  readonly updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  readonly user?: Maybe<EndUser>;
};

export type MemberProfile = {
  readonly __typename?: "MemberProfile";
  readonly avatarDocumentId?: Maybe<Scalars["String"]["output"]>;
  readonly bio?: Maybe<Scalars["String"]["output"]>;
  readonly email?: Maybe<Scalars["String"]["output"]>;
  readonly interests?: Maybe<ReadonlyArray<Maybe<Scalars["String"]["output"]>>>;
  readonly name?: Maybe<Scalars["String"]["output"]>;
  readonly showEmail?: Maybe<Scalars["Boolean"]["output"]>;
  readonly showInterests?: Maybe<Scalars["Boolean"]["output"]>;
  readonly showLocation?: Maybe<Scalars["Boolean"]["output"]>;
  readonly showProfile?: Maybe<Scalars["Boolean"]["output"]>;
  readonly showProperties?: Maybe<Scalars["Boolean"]["output"]>;
};

/** Base type for all models in mongo. */
export type MongoBase = {
  readonly createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** The ID of the object. */
  readonly id: Scalars["ObjectID"]["output"];
  readonly schemaVersion?: Maybe<Scalars["String"]["output"]>;
  /** Automatically generated timestamp, updated on every save. */
  readonly updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

/** Base type for all models in mongo. */
export type MongoSubdocument = {
  readonly createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** The ID of the object. */
  readonly id: Scalars["ObjectID"]["output"];
  /** Automatically generated timestamp, updated on every save. */
  readonly updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

/**  Base Mutation Type definition - all mutations will be defined in separate files extending this type  */
export type Mutation = {
  readonly __typename?: "Mutation";
  /** IGNORE: Dummy field necessary for the Mutation type to be valid */
  readonly _empty?: Maybe<Scalars["String"]["output"]>;
  readonly communityCreate: CommunityMutationResult;
};

/**  Base Mutation Type definition - all mutations will be defined in separate files extending this type  */
export type MutationCommunityCreateArgs = {
  input: CommunityCreateInput;
};

export type MutationResult = {
  readonly status: MutationStatus;
};

export type MutationStatus = {
  readonly __typename?: "MutationStatus";
  readonly errorMessage?: Maybe<Scalars["String"]["output"]>;
  readonly success: Scalars["Boolean"]["output"];
};

/**  Base Query Type definition - , all mutations will be defined in separate files extending this type  */
export type Query = {
  readonly __typename?: "Query";
  /** IGNORE: Dummy field necessary for the Query type to be valid */
  readonly _empty?: Maybe<Scalars["String"]["output"]>;
  readonly communitiesForCurrentEndUser?: Maybe<ReadonlyArray<Maybe<Community>>>;
  readonly communityById?: Maybe<Community>;
  readonly currentCommunity?: Maybe<Community>;
  readonly currentEndUserAndCreateIfNotExists: EndUser;
  readonly endUserById?: Maybe<EndUser>;
  readonly hello?: Maybe<Scalars["String"]["output"]>;
  readonly membersForCurrentEndUser: ReadonlyArray<Member>;
};

/**  Base Query Type definition - , all mutations will be defined in separate files extending this type  */
export type QueryCommunityByIdArgs = {
  id: Scalars["ObjectID"]["input"];
};

/**  Base Query Type definition - , all mutations will be defined in separate files extending this type  */
export type QueryEndUserByIdArgs = {
  id: Scalars["ObjectID"]["input"];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
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

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = ResolversObject<{
  MongoBase:
    | import("@ocom/api-domain").Domain.Contexts.Community.Community.CommunityEntityReference
    | import("@ocom/api-domain").Domain.Contexts.User.EndUser.EndUserEntityReference
    | import("@ocom/api-domain").Domain.Contexts.Community.Member.MemberEntityReference;
  MongoSubdocument: Omit<MemberAccount, "createdBy" | "user"> & { createdBy?: Maybe<_RefType["EndUser"]>; user?: Maybe<_RefType["EndUser"]> };
  MutationResult: Omit<CommunityMutationResult, "community"> & { community?: Maybe<_RefType["Community"]> };
}>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AccountNumber: ResolverTypeWrapper<Scalars["AccountNumber"]["output"]>;
  BigInt: ResolverTypeWrapper<Scalars["BigInt"]["output"]>;
  BlobAuthHeader: ResolverTypeWrapper<BlobAuthHeader>;
  BlobIndexTag: ResolverTypeWrapper<BlobIndexTag>;
  BlobMetadataField: ResolverTypeWrapper<BlobMetadataField>;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  Byte: ResolverTypeWrapper<Scalars["Byte"]["output"]>;
  CacheControlScope: CacheControlScope;
  Community: ResolverTypeWrapper<import("@ocom/api-domain").Domain.Contexts.Community.Community.CommunityEntityReference>;
  CommunityCreateInput: CommunityCreateInput;
  CommunityMutationResult: ResolverTypeWrapper<Omit<CommunityMutationResult, "community"> & { community?: Maybe<ResolversTypes["Community"]> }>;
  CountryCode: ResolverTypeWrapper<Scalars["CountryCode"]["output"]>;
  CountryName: ResolverTypeWrapper<Scalars["CountryName"]["output"]>;
  Cuid: ResolverTypeWrapper<Scalars["Cuid"]["output"]>;
  Currency: ResolverTypeWrapper<Scalars["Currency"]["output"]>;
  DID: ResolverTypeWrapper<Scalars["DID"]["output"]>;
  Date: ResolverTypeWrapper<Scalars["Date"]["output"]>;
  DateTime: ResolverTypeWrapper<Scalars["DateTime"]["output"]>;
  DateTimeISO: ResolverTypeWrapper<Scalars["DateTimeISO"]["output"]>;
  DeweyDecimal: ResolverTypeWrapper<Scalars["DeweyDecimal"]["output"]>;
  Duration: ResolverTypeWrapper<Scalars["Duration"]["output"]>;
  EmailAddress: ResolverTypeWrapper<Scalars["EmailAddress"]["output"]>;
  EndUser: ResolverTypeWrapper<import("@ocom/api-domain").Domain.Contexts.User.EndUser.EndUserEntityReference>;
  EndUserContactInformation: ResolverTypeWrapper<EndUserContactInformation>;
  EndUserIdentityDetails: ResolverTypeWrapper<EndUserIdentityDetails>;
  EndUserPersonalInformation: ResolverTypeWrapper<EndUserPersonalInformation>;
  GUID: ResolverTypeWrapper<Scalars["GUID"]["output"]>;
  GeoJSON: ResolverTypeWrapper<Scalars["GeoJSON"]["output"]>;
  HSL: ResolverTypeWrapper<Scalars["HSL"]["output"]>;
  HSLA: ResolverTypeWrapper<Scalars["HSLA"]["output"]>;
  HexColorCode: ResolverTypeWrapper<Scalars["HexColorCode"]["output"]>;
  Hexadecimal: ResolverTypeWrapper<Scalars["Hexadecimal"]["output"]>;
  IBAN: ResolverTypeWrapper<Scalars["IBAN"]["output"]>;
  IP: ResolverTypeWrapper<Scalars["IP"]["output"]>;
  IPCPatent: ResolverTypeWrapper<Scalars["IPCPatent"]["output"]>;
  IPv4: ResolverTypeWrapper<Scalars["IPv4"]["output"]>;
  IPv6: ResolverTypeWrapper<Scalars["IPv6"]["output"]>;
  ISBN: ResolverTypeWrapper<Scalars["ISBN"]["output"]>;
  ISO8601Duration: ResolverTypeWrapper<Scalars["ISO8601Duration"]["output"]>;
  Int: ResolverTypeWrapper<Scalars["Int"]["output"]>;
  JSON: ResolverTypeWrapper<Scalars["JSON"]["output"]>;
  JSONObject: ResolverTypeWrapper<Scalars["JSONObject"]["output"]>;
  JWT: ResolverTypeWrapper<Scalars["JWT"]["output"]>;
  LCCSubclass: ResolverTypeWrapper<Scalars["LCCSubclass"]["output"]>;
  Latitude: ResolverTypeWrapper<Scalars["Latitude"]["output"]>;
  LocalDate: ResolverTypeWrapper<Scalars["LocalDate"]["output"]>;
  LocalDateTime: ResolverTypeWrapper<Scalars["LocalDateTime"]["output"]>;
  LocalEndTime: ResolverTypeWrapper<Scalars["LocalEndTime"]["output"]>;
  LocalTime: ResolverTypeWrapper<Scalars["LocalTime"]["output"]>;
  Locale: ResolverTypeWrapper<Scalars["Locale"]["output"]>;
  Long: ResolverTypeWrapper<Scalars["Long"]["output"]>;
  Longitude: ResolverTypeWrapper<Scalars["Longitude"]["output"]>;
  MAC: ResolverTypeWrapper<Scalars["MAC"]["output"]>;
  Member: ResolverTypeWrapper<import("@ocom/api-domain").Domain.Contexts.Community.Member.MemberEntityReference>;
  MemberAccount: ResolverTypeWrapper<
    Omit<MemberAccount, "createdBy" | "user"> & { createdBy?: Maybe<ResolversTypes["EndUser"]>; user?: Maybe<ResolversTypes["EndUser"]> }
  >;
  MemberProfile: ResolverTypeWrapper<MemberProfile>;
  MongoBase: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>["MongoBase"]>;
  MongoSubdocument: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>["MongoSubdocument"]>;
  Mutation: ResolverTypeWrapper<{}>;
  MutationResult: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>["MutationResult"]>;
  MutationStatus: ResolverTypeWrapper<MutationStatus>;
  NegativeFloat: ResolverTypeWrapper<Scalars["NegativeFloat"]["output"]>;
  NegativeInt: ResolverTypeWrapper<Scalars["NegativeInt"]["output"]>;
  NonEmptyString: ResolverTypeWrapper<Scalars["NonEmptyString"]["output"]>;
  NonNegativeFloat: ResolverTypeWrapper<Scalars["NonNegativeFloat"]["output"]>;
  NonNegativeInt: ResolverTypeWrapper<Scalars["NonNegativeInt"]["output"]>;
  NonPositiveFloat: ResolverTypeWrapper<Scalars["NonPositiveFloat"]["output"]>;
  NonPositiveInt: ResolverTypeWrapper<Scalars["NonPositiveInt"]["output"]>;
  ObjectID: ResolverTypeWrapper<Scalars["ObjectID"]["output"]>;
  PhoneNumber: ResolverTypeWrapper<Scalars["PhoneNumber"]["output"]>;
  Port: ResolverTypeWrapper<Scalars["Port"]["output"]>;
  PositiveFloat: ResolverTypeWrapper<Scalars["PositiveFloat"]["output"]>;
  PositiveInt: ResolverTypeWrapper<Scalars["PositiveInt"]["output"]>;
  PostalCode: ResolverTypeWrapper<Scalars["PostalCode"]["output"]>;
  Query: ResolverTypeWrapper<{}>;
  RGB: ResolverTypeWrapper<Scalars["RGB"]["output"]>;
  RGBA: ResolverTypeWrapper<Scalars["RGBA"]["output"]>;
  RoutingNumber: ResolverTypeWrapper<Scalars["RoutingNumber"]["output"]>;
  SESSN: ResolverTypeWrapper<Scalars["SESSN"]["output"]>;
  SafeInt: ResolverTypeWrapper<Scalars["SafeInt"]["output"]>;
  SemVer: ResolverTypeWrapper<Scalars["SemVer"]["output"]>;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
  Time: ResolverTypeWrapper<Scalars["Time"]["output"]>;
  TimeZone: ResolverTypeWrapper<Scalars["TimeZone"]["output"]>;
  Timestamp: ResolverTypeWrapper<Scalars["Timestamp"]["output"]>;
  URL: ResolverTypeWrapper<Scalars["URL"]["output"]>;
  USCurrency: ResolverTypeWrapper<Scalars["USCurrency"]["output"]>;
  UUID: ResolverTypeWrapper<Scalars["UUID"]["output"]>;
  UnsignedFloat: ResolverTypeWrapper<Scalars["UnsignedFloat"]["output"]>;
  UnsignedInt: ResolverTypeWrapper<Scalars["UnsignedInt"]["output"]>;
  UtcOffset: ResolverTypeWrapper<Scalars["UtcOffset"]["output"]>;
  Void: ResolverTypeWrapper<Scalars["Void"]["output"]>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AccountNumber: Scalars["AccountNumber"]["output"];
  BigInt: Scalars["BigInt"]["output"];
  BlobAuthHeader: BlobAuthHeader;
  BlobIndexTag: BlobIndexTag;
  BlobMetadataField: BlobMetadataField;
  Boolean: Scalars["Boolean"]["output"];
  Byte: Scalars["Byte"]["output"];
  Community: import("@ocom/api-domain").Domain.Contexts.Community.Community.CommunityEntityReference;
  CommunityCreateInput: CommunityCreateInput;
  CommunityMutationResult: Omit<CommunityMutationResult, "community"> & { community?: Maybe<ResolversParentTypes["Community"]> };
  CountryCode: Scalars["CountryCode"]["output"];
  CountryName: Scalars["CountryName"]["output"];
  Cuid: Scalars["Cuid"]["output"];
  Currency: Scalars["Currency"]["output"];
  DID: Scalars["DID"]["output"];
  Date: Scalars["Date"]["output"];
  DateTime: Scalars["DateTime"]["output"];
  DateTimeISO: Scalars["DateTimeISO"]["output"];
  DeweyDecimal: Scalars["DeweyDecimal"]["output"];
  Duration: Scalars["Duration"]["output"];
  EmailAddress: Scalars["EmailAddress"]["output"];
  EndUser: import("@ocom/api-domain").Domain.Contexts.User.EndUser.EndUserEntityReference;
  EndUserContactInformation: EndUserContactInformation;
  EndUserIdentityDetails: EndUserIdentityDetails;
  EndUserPersonalInformation: EndUserPersonalInformation;
  GUID: Scalars["GUID"]["output"];
  GeoJSON: Scalars["GeoJSON"]["output"];
  HSL: Scalars["HSL"]["output"];
  HSLA: Scalars["HSLA"]["output"];
  HexColorCode: Scalars["HexColorCode"]["output"];
  Hexadecimal: Scalars["Hexadecimal"]["output"];
  IBAN: Scalars["IBAN"]["output"];
  IP: Scalars["IP"]["output"];
  IPCPatent: Scalars["IPCPatent"]["output"];
  IPv4: Scalars["IPv4"]["output"];
  IPv6: Scalars["IPv6"]["output"];
  ISBN: Scalars["ISBN"]["output"];
  ISO8601Duration: Scalars["ISO8601Duration"]["output"];
  Int: Scalars["Int"]["output"];
  JSON: Scalars["JSON"]["output"];
  JSONObject: Scalars["JSONObject"]["output"];
  JWT: Scalars["JWT"]["output"];
  LCCSubclass: Scalars["LCCSubclass"]["output"];
  Latitude: Scalars["Latitude"]["output"];
  LocalDate: Scalars["LocalDate"]["output"];
  LocalDateTime: Scalars["LocalDateTime"]["output"];
  LocalEndTime: Scalars["LocalEndTime"]["output"];
  LocalTime: Scalars["LocalTime"]["output"];
  Locale: Scalars["Locale"]["output"];
  Long: Scalars["Long"]["output"];
  Longitude: Scalars["Longitude"]["output"];
  MAC: Scalars["MAC"]["output"];
  Member: import("@ocom/api-domain").Domain.Contexts.Community.Member.MemberEntityReference;
  MemberAccount: Omit<MemberAccount, "createdBy" | "user"> & {
    createdBy?: Maybe<ResolversParentTypes["EndUser"]>;
    user?: Maybe<ResolversParentTypes["EndUser"]>;
  };
  MemberProfile: MemberProfile;
  MongoBase: ResolversInterfaceTypes<ResolversParentTypes>["MongoBase"];
  MongoSubdocument: ResolversInterfaceTypes<ResolversParentTypes>["MongoSubdocument"];
  Mutation: {};
  MutationResult: ResolversInterfaceTypes<ResolversParentTypes>["MutationResult"];
  MutationStatus: MutationStatus;
  NegativeFloat: Scalars["NegativeFloat"]["output"];
  NegativeInt: Scalars["NegativeInt"]["output"];
  NonEmptyString: Scalars["NonEmptyString"]["output"];
  NonNegativeFloat: Scalars["NonNegativeFloat"]["output"];
  NonNegativeInt: Scalars["NonNegativeInt"]["output"];
  NonPositiveFloat: Scalars["NonPositiveFloat"]["output"];
  NonPositiveInt: Scalars["NonPositiveInt"]["output"];
  ObjectID: Scalars["ObjectID"]["output"];
  PhoneNumber: Scalars["PhoneNumber"]["output"];
  Port: Scalars["Port"]["output"];
  PositiveFloat: Scalars["PositiveFloat"]["output"];
  PositiveInt: Scalars["PositiveInt"]["output"];
  PostalCode: Scalars["PostalCode"]["output"];
  Query: {};
  RGB: Scalars["RGB"]["output"];
  RGBA: Scalars["RGBA"]["output"];
  RoutingNumber: Scalars["RoutingNumber"]["output"];
  SESSN: Scalars["SESSN"]["output"];
  SafeInt: Scalars["SafeInt"]["output"];
  SemVer: Scalars["SemVer"]["output"];
  String: Scalars["String"]["output"];
  Time: Scalars["Time"]["output"];
  TimeZone: Scalars["TimeZone"]["output"];
  Timestamp: Scalars["Timestamp"]["output"];
  URL: Scalars["URL"]["output"];
  USCurrency: Scalars["USCurrency"]["output"];
  UUID: Scalars["UUID"]["output"];
  UnsignedFloat: Scalars["UnsignedFloat"]["output"];
  UnsignedInt: Scalars["UnsignedInt"]["output"];
  UtcOffset: Scalars["UtcOffset"]["output"];
  Void: Scalars["Void"]["output"];
}>;

export type CacheControl22DirectiveArgs = {
  inheritMaxAge?: Maybe<Scalars["Boolean"]["input"]>;
  maxAge?: Maybe<Scalars["Int"]["input"]>;
  scope?: Maybe<CacheControlScope>;
};

export type CacheControl22DirectiveResolver<Result, Parent, ContextType = GraphContext, Args = CacheControl22DirectiveArgs> = DirectiveResolverFn<
  Result,
  Parent,
  ContextType,
  Args
>;

export interface AccountNumberScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["AccountNumber"], any> {
  name: "AccountNumber";
}

export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["BigInt"], any> {
  name: "BigInt";
}

export type BlobAuthHeaderResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["BlobAuthHeader"] = ResolversParentTypes["BlobAuthHeader"],
> = ResolversObject<{
  authHeader?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  blobName?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  blobPath?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  indexTags?: Resolver<Maybe<ReadonlyArray<Maybe<ResolversTypes["BlobIndexTag"]>>>, ParentType, ContextType>;
  metadataFields?: Resolver<Maybe<ReadonlyArray<Maybe<ResolversTypes["BlobMetadataField"]>>>, ParentType, ContextType>;
  requestDate?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BlobIndexTagResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["BlobIndexTag"] = ResolversParentTypes["BlobIndexTag"],
> = ResolversObject<{
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  value?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BlobMetadataFieldResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["BlobMetadataField"] = ResolversParentTypes["BlobMetadataField"],
> = ResolversObject<{
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  value?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface ByteScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Byte"], any> {
  name: "Byte";
}

export type CommunityResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["Community"] = ResolversParentTypes["Community"],
> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes["EndUser"], ParentType, ContextType>;
  domain?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  handle?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ObjectID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  publicContentBlobUrl?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  schemaVersion?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  whiteLabelDomain?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CommunityMutationResultResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["CommunityMutationResult"] = ResolversParentTypes["CommunityMutationResult"],
> = ResolversObject<{
  community?: Resolver<Maybe<ResolversTypes["Community"]>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes["MutationStatus"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface CountryCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["CountryCode"], any> {
  name: "CountryCode";
}

export interface CountryNameScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["CountryName"], any> {
  name: "CountryName";
}

export interface CuidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Cuid"], any> {
  name: "Cuid";
}

export interface CurrencyScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Currency"], any> {
  name: "Currency";
}

export interface DidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["DID"], any> {
  name: "DID";
}

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Date"], any> {
  name: "Date";
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["DateTime"], any> {
  name: "DateTime";
}

export interface DateTimeIsoScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["DateTimeISO"], any> {
  name: "DateTimeISO";
}

export interface DeweyDecimalScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["DeweyDecimal"], any> {
  name: "DeweyDecimal";
}

export interface DurationScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Duration"], any> {
  name: "Duration";
}

export interface EmailAddressScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["EmailAddress"], any> {
  name: "EmailAddress";
}

export type EndUserResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["EndUser"] = ResolversParentTypes["EndUser"],
> = ResolversObject<{
  accessBlocked?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  displayName?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  externalId?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ObjectID"], ParentType, ContextType>;
  personalInformation?: Resolver<Maybe<ResolversTypes["EndUserPersonalInformation"]>, ParentType, ContextType>;
  schemaVersion?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  tags?: Resolver<Maybe<ReadonlyArray<Maybe<ResolversTypes["String"]>>>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EndUserContactInformationResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["EndUserContactInformation"] = ResolversParentTypes["EndUserContactInformation"],
> = ResolversObject<{
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EndUserIdentityDetailsResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["EndUserIdentityDetails"] = ResolversParentTypes["EndUserIdentityDetails"],
> = ResolversObject<{
  lastName?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  legalNameConsistsOfOneName?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  restOfName?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EndUserPersonalInformationResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["EndUserPersonalInformation"] = ResolversParentTypes["EndUserPersonalInformation"],
> = ResolversObject<{
  contactInformation?: Resolver<Maybe<ResolversTypes["EndUserContactInformation"]>, ParentType, ContextType>;
  identityDetails?: Resolver<Maybe<ResolversTypes["EndUserIdentityDetails"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface GuidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["GUID"], any> {
  name: "GUID";
}

export interface GeoJsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["GeoJSON"], any> {
  name: "GeoJSON";
}

export interface HslScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["HSL"], any> {
  name: "HSL";
}

export interface HslaScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["HSLA"], any> {
  name: "HSLA";
}

export interface HexColorCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["HexColorCode"], any> {
  name: "HexColorCode";
}

export interface HexadecimalScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Hexadecimal"], any> {
  name: "Hexadecimal";
}

export interface IbanScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["IBAN"], any> {
  name: "IBAN";
}

export interface IpScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["IP"], any> {
  name: "IP";
}

export interface IpcPatentScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["IPCPatent"], any> {
  name: "IPCPatent";
}

export interface IPv4ScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["IPv4"], any> {
  name: "IPv4";
}

export interface IPv6ScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["IPv6"], any> {
  name: "IPv6";
}

export interface IsbnScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["ISBN"], any> {
  name: "ISBN";
}

export interface Iso8601DurationScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["ISO8601Duration"], any> {
  name: "ISO8601Duration";
}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["JSON"], any> {
  name: "JSON";
}

export interface JsonObjectScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["JSONObject"], any> {
  name: "JSONObject";
}

export interface JwtScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["JWT"], any> {
  name: "JWT";
}

export interface LccSubclassScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["LCCSubclass"], any> {
  name: "LCCSubclass";
}

export interface LatitudeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Latitude"], any> {
  name: "Latitude";
}

export interface LocalDateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["LocalDate"], any> {
  name: "LocalDate";
}

export interface LocalDateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["LocalDateTime"], any> {
  name: "LocalDateTime";
}

export interface LocalEndTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["LocalEndTime"], any> {
  name: "LocalEndTime";
}

export interface LocalTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["LocalTime"], any> {
  name: "LocalTime";
}

export interface LocaleScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Locale"], any> {
  name: "Locale";
}

export interface LongScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Long"], any> {
  name: "Long";
}

export interface LongitudeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Longitude"], any> {
  name: "Longitude";
}

export interface MacScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["MAC"], any> {
  name: "MAC";
}

export type MemberResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["Member"] = ResolversParentTypes["Member"],
> = ResolversObject<{
  accounts?: Resolver<ReadonlyArray<ResolversTypes["MemberAccount"]>, ParentType, ContextType>;
  community?: Resolver<Maybe<ResolversTypes["Community"]>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ObjectID"], ParentType, ContextType>;
  isAdmin?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  memberName?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  profile?: Resolver<Maybe<ResolversTypes["MemberProfile"]>, ParentType, ContextType>;
  schemaVersion?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MemberAccountResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["MemberAccount"] = ResolversParentTypes["MemberAccount"],
> = ResolversObject<{
  createdAt?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  createdBy?: Resolver<Maybe<ResolversTypes["EndUser"]>, ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ObjectID"], ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  statusCode?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes["EndUser"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MemberProfileResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["MemberProfile"] = ResolversParentTypes["MemberProfile"],
> = ResolversObject<{
  avatarDocumentId?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  bio?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  interests?: Resolver<Maybe<ReadonlyArray<Maybe<ResolversTypes["String"]>>>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  showEmail?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  showInterests?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  showLocation?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  showProfile?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  showProperties?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MongoBaseResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["MongoBase"] = ResolversParentTypes["MongoBase"],
> = ResolversObject<{
  __resolveType: TypeResolveFn<"Community" | "EndUser" | "Member", ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ObjectID"], ParentType, ContextType>;
  schemaVersion?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
}>;

export type MongoSubdocumentResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["MongoSubdocument"] = ResolversParentTypes["MongoSubdocument"],
> = ResolversObject<{
  __resolveType: TypeResolveFn<"MemberAccount", ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ObjectID"], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
}>;

export type MutationResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"],
> = ResolversObject<{
  _empty?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  communityCreate?: Resolver<ResolversTypes["CommunityMutationResult"], ParentType, ContextType, RequireFields<MutationCommunityCreateArgs, "input">>;
}>;

export type MutationResultResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["MutationResult"] = ResolversParentTypes["MutationResult"],
> = ResolversObject<{
  __resolveType: TypeResolveFn<"CommunityMutationResult", ParentType, ContextType>;
  status?: Resolver<ResolversTypes["MutationStatus"], ParentType, ContextType>;
}>;

export type MutationStatusResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["MutationStatus"] = ResolversParentTypes["MutationStatus"],
> = ResolversObject<{
  errorMessage?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface NegativeFloatScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["NegativeFloat"], any> {
  name: "NegativeFloat";
}

export interface NegativeIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["NegativeInt"], any> {
  name: "NegativeInt";
}

export interface NonEmptyStringScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["NonEmptyString"], any> {
  name: "NonEmptyString";
}

export interface NonNegativeFloatScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["NonNegativeFloat"], any> {
  name: "NonNegativeFloat";
}

export interface NonNegativeIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["NonNegativeInt"], any> {
  name: "NonNegativeInt";
}

export interface NonPositiveFloatScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["NonPositiveFloat"], any> {
  name: "NonPositiveFloat";
}

export interface NonPositiveIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["NonPositiveInt"], any> {
  name: "NonPositiveInt";
}

export interface ObjectIdScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["ObjectID"], any> {
  name: "ObjectID";
}

export interface PhoneNumberScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["PhoneNumber"], any> {
  name: "PhoneNumber";
}

export interface PortScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Port"], any> {
  name: "Port";
}

export interface PositiveFloatScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["PositiveFloat"], any> {
  name: "PositiveFloat";
}

export interface PositiveIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["PositiveInt"], any> {
  name: "PositiveInt";
}

export interface PostalCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["PostalCode"], any> {
  name: "PostalCode";
}

export type QueryResolvers<
  ContextType = GraphContext,
  ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"],
> = ResolversObject<{
  _empty?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  communitiesForCurrentEndUser?: Resolver<Maybe<ReadonlyArray<Maybe<ResolversTypes["Community"]>>>, ParentType, ContextType>;
  communityById?: Resolver<Maybe<ResolversTypes["Community"]>, ParentType, ContextType, RequireFields<QueryCommunityByIdArgs, "id">>;
  currentCommunity?: Resolver<Maybe<ResolversTypes["Community"]>, ParentType, ContextType>;
  currentEndUserAndCreateIfNotExists?: Resolver<ResolversTypes["EndUser"], ParentType, ContextType>;
  endUserById?: Resolver<Maybe<ResolversTypes["EndUser"]>, ParentType, ContextType, RequireFields<QueryEndUserByIdArgs, "id">>;
  hello?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  membersForCurrentEndUser?: Resolver<ReadonlyArray<ResolversTypes["Member"]>, ParentType, ContextType>;
}>;

export interface RgbScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["RGB"], any> {
  name: "RGB";
}

export interface RgbaScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["RGBA"], any> {
  name: "RGBA";
}

export interface RoutingNumberScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["RoutingNumber"], any> {
  name: "RoutingNumber";
}

export interface SessnScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["SESSN"], any> {
  name: "SESSN";
}

export interface SafeIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["SafeInt"], any> {
  name: "SafeInt";
}

export interface SemVerScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["SemVer"], any> {
  name: "SemVer";
}

export interface TimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Time"], any> {
  name: "Time";
}

export interface TimeZoneScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["TimeZone"], any> {
  name: "TimeZone";
}

export interface TimestampScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Timestamp"], any> {
  name: "Timestamp";
}

export interface UrlScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["URL"], any> {
  name: "URL";
}

export interface UsCurrencyScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["USCurrency"], any> {
  name: "USCurrency";
}

export interface UuidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["UUID"], any> {
  name: "UUID";
}

export interface UnsignedFloatScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["UnsignedFloat"], any> {
  name: "UnsignedFloat";
}

export interface UnsignedIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["UnsignedInt"], any> {
  name: "UnsignedInt";
}

export interface UtcOffsetScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["UtcOffset"], any> {
  name: "UtcOffset";
}

export interface VoidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["Void"], any> {
  name: "Void";
}

export type Resolvers<ContextType = GraphContext> = ResolversObject<{
  AccountNumber?: GraphQLScalarType;
  BigInt?: GraphQLScalarType;
  BlobAuthHeader?: BlobAuthHeaderResolvers<ContextType>;
  BlobIndexTag?: BlobIndexTagResolvers<ContextType>;
  BlobMetadataField?: BlobMetadataFieldResolvers<ContextType>;
  Byte?: GraphQLScalarType;
  Community?: CommunityResolvers<ContextType>;
  CommunityMutationResult?: CommunityMutationResultResolvers<ContextType>;
  CountryCode?: GraphQLScalarType;
  CountryName?: GraphQLScalarType;
  Cuid?: GraphQLScalarType;
  Currency?: GraphQLScalarType;
  DID?: GraphQLScalarType;
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  DateTimeISO?: GraphQLScalarType;
  DeweyDecimal?: GraphQLScalarType;
  Duration?: GraphQLScalarType;
  EmailAddress?: GraphQLScalarType;
  EndUser?: EndUserResolvers<ContextType>;
  EndUserContactInformation?: EndUserContactInformationResolvers<ContextType>;
  EndUserIdentityDetails?: EndUserIdentityDetailsResolvers<ContextType>;
  EndUserPersonalInformation?: EndUserPersonalInformationResolvers<ContextType>;
  GUID?: GraphQLScalarType;
  GeoJSON?: GraphQLScalarType;
  HSL?: GraphQLScalarType;
  HSLA?: GraphQLScalarType;
  HexColorCode?: GraphQLScalarType;
  Hexadecimal?: GraphQLScalarType;
  IBAN?: GraphQLScalarType;
  IP?: GraphQLScalarType;
  IPCPatent?: GraphQLScalarType;
  IPv4?: GraphQLScalarType;
  IPv6?: GraphQLScalarType;
  ISBN?: GraphQLScalarType;
  ISO8601Duration?: GraphQLScalarType;
  JSON?: GraphQLScalarType;
  JSONObject?: GraphQLScalarType;
  JWT?: GraphQLScalarType;
  LCCSubclass?: GraphQLScalarType;
  Latitude?: GraphQLScalarType;
  LocalDate?: GraphQLScalarType;
  LocalDateTime?: GraphQLScalarType;
  LocalEndTime?: GraphQLScalarType;
  LocalTime?: GraphQLScalarType;
  Locale?: GraphQLScalarType;
  Long?: GraphQLScalarType;
  Longitude?: GraphQLScalarType;
  MAC?: GraphQLScalarType;
  Member?: MemberResolvers<ContextType>;
  MemberAccount?: MemberAccountResolvers<ContextType>;
  MemberProfile?: MemberProfileResolvers<ContextType>;
  MongoBase?: MongoBaseResolvers<ContextType>;
  MongoSubdocument?: MongoSubdocumentResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  MutationResult?: MutationResultResolvers<ContextType>;
  MutationStatus?: MutationStatusResolvers<ContextType>;
  NegativeFloat?: GraphQLScalarType;
  NegativeInt?: GraphQLScalarType;
  NonEmptyString?: GraphQLScalarType;
  NonNegativeFloat?: GraphQLScalarType;
  NonNegativeInt?: GraphQLScalarType;
  NonPositiveFloat?: GraphQLScalarType;
  NonPositiveInt?: GraphQLScalarType;
  ObjectID?: GraphQLScalarType;
  PhoneNumber?: GraphQLScalarType;
  Port?: GraphQLScalarType;
  PositiveFloat?: GraphQLScalarType;
  PositiveInt?: GraphQLScalarType;
  PostalCode?: GraphQLScalarType;
  Query?: QueryResolvers<ContextType>;
  RGB?: GraphQLScalarType;
  RGBA?: GraphQLScalarType;
  RoutingNumber?: GraphQLScalarType;
  SESSN?: GraphQLScalarType;
  SafeInt?: GraphQLScalarType;
  SemVer?: GraphQLScalarType;
  Time?: GraphQLScalarType;
  TimeZone?: GraphQLScalarType;
  Timestamp?: GraphQLScalarType;
  URL?: GraphQLScalarType;
  USCurrency?: GraphQLScalarType;
  UUID?: GraphQLScalarType;
  UnsignedFloat?: GraphQLScalarType;
  UnsignedInt?: GraphQLScalarType;
  UtcOffset?: GraphQLScalarType;
  Void?: GraphQLScalarType;
}>;

export type DirectiveResolvers<ContextType = GraphContext> = ResolversObject<{
  cacheControl22?: CacheControl22DirectiveResolver<any, any, ContextType>;
}>;
