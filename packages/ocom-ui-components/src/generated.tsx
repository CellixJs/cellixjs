import type { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
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
  Date: { input: any; output: any };
  DateTime: { input: any; output: any };
  DateTimeISO: { input: any; output: any };
  DeweyDecimal: { input: any; output: any };
  Duration: { input: any; output: any };
  EmailAddress: { input: any; output: any };
  GUID: { input: any; output: any };
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
  __typename?: "BlobAuthHeader";
  authHeader?: Maybe<Scalars["String"]["output"]>;
  blobName?: Maybe<Scalars["String"]["output"]>;
  blobPath?: Maybe<Scalars["String"]["output"]>;
  indexTags?: Maybe<Array<Maybe<BlobIndexTag>>>;
  metadataFields?: Maybe<Array<Maybe<BlobMetadataField>>>;
  requestDate?: Maybe<Scalars["String"]["output"]>;
};

export type BlobIndexTag = {
  __typename?: "BlobIndexTag";
  name: Scalars["String"]["output"];
  value: Scalars["String"]["output"];
};

export type BlobMetadataField = {
  __typename?: "BlobMetadataField";
  name: Scalars["String"]["output"];
  value: Scalars["String"]["output"];
};

/**  Required to enable Apollo Cache Control  */
export type CacheControlScope = "PRIVATE" | "PUBLIC";

export type Community = MongoBase & {
  __typename?: "Community";
  createdAt: Scalars["DateTime"]["output"];
  createdBy: EndUser;
  domain?: Maybe<Scalars["String"]["output"]>;
  handle?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ObjectID"]["output"];
  name: Scalars["String"]["output"];
  publicContentBlobUrl?: Maybe<Scalars["String"]["output"]>;
  schemaVersion: Scalars["String"]["output"];
  updatedAt: Scalars["DateTime"]["output"];
  whiteLabelDomain?: Maybe<Scalars["String"]["output"]>;
};

export type CommunityCreateInput = {
  name: Scalars["String"]["input"];
};

export type CommunityMutationResult = MutationResult & {
  __typename?: "CommunityMutationResult";
  community?: Maybe<Community>;
  status: MutationStatus;
};

export type EndUser = MongoBase & {
  __typename?: "EndUser";
  accessBlocked?: Maybe<Scalars["Boolean"]["output"]>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  displayName?: Maybe<Scalars["String"]["output"]>;
  externalId?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ObjectID"]["output"];
  personalInformation?: Maybe<EndUserPersonalInformation>;
  schemaVersion?: Maybe<Scalars["String"]["output"]>;
  tags?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export type EndUserContactInformation = {
  __typename?: "EndUserContactInformation";
  email: Scalars["String"]["output"];
};

export type EndUserIdentityDetails = {
  __typename?: "EndUserIdentityDetails";
  lastName: Scalars["String"]["output"];
  legalNameConsistsOfOneName: Scalars["Boolean"]["output"];
  restOfName?: Maybe<Scalars["String"]["output"]>;
};

export type EndUserPersonalInformation = {
  __typename?: "EndUserPersonalInformation";
  contactInformation?: Maybe<EndUserContactInformation>;
  identityDetails?: Maybe<EndUserIdentityDetails>;
};

export type Member = MongoBase & {
  __typename?: "Member";
  accounts: Array<MemberAccount>;
  community?: Maybe<Community>;
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["ObjectID"]["output"];
  isAdmin?: Maybe<Scalars["Boolean"]["output"]>;
  memberName?: Maybe<Scalars["String"]["output"]>;
  profile?: Maybe<MemberProfile>;
  schemaVersion?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export type MemberAccount = MongoSubdocument & {
  __typename?: "MemberAccount";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  createdBy?: Maybe<EndUser>;
  firstName: Scalars["String"]["output"];
  id: Scalars["ObjectID"]["output"];
  lastName?: Maybe<Scalars["String"]["output"]>;
  statusCode?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  user?: Maybe<EndUser>;
};

export type MemberProfile = {
  __typename?: "MemberProfile";
  avatarDocumentId?: Maybe<Scalars["String"]["output"]>;
  bio?: Maybe<Scalars["String"]["output"]>;
  email?: Maybe<Scalars["String"]["output"]>;
  interests?: Maybe<Array<Maybe<Scalars["String"]["output"]>>>;
  name?: Maybe<Scalars["String"]["output"]>;
  showEmail?: Maybe<Scalars["Boolean"]["output"]>;
  showInterests?: Maybe<Scalars["Boolean"]["output"]>;
  showLocation?: Maybe<Scalars["Boolean"]["output"]>;
  showProfile?: Maybe<Scalars["Boolean"]["output"]>;
  showProperties?: Maybe<Scalars["Boolean"]["output"]>;
};

/** Base type for all models in mongo. */
export type MongoBase = {
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** The ID of the object. */
  id: Scalars["ObjectID"]["output"];
  schemaVersion?: Maybe<Scalars["String"]["output"]>;
  /** Automatically generated timestamp, updated on every save. */
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

/** Base type for all models in mongo. */
export type MongoSubdocument = {
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** The ID of the object. */
  id: Scalars["ObjectID"]["output"];
  /** Automatically generated timestamp, updated on every save. */
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

/**  Base Mutation Type definition - all mutations will be defined in separate files extending this type  */
export type Mutation = {
  __typename?: "Mutation";
  /** IGNORE: Dummy field necessary for the Mutation type to be valid */
  _empty?: Maybe<Scalars["String"]["output"]>;
  communityCreate: CommunityMutationResult;
};

/**  Base Mutation Type definition - all mutations will be defined in separate files extending this type  */
export type MutationCommunityCreateArgs = {
  input: CommunityCreateInput;
};

export type MutationResult = {
  status: MutationStatus;
};

export type MutationStatus = {
  __typename?: "MutationStatus";
  errorMessage?: Maybe<Scalars["String"]["output"]>;
  success: Scalars["Boolean"]["output"];
};

/**  Base Query Type definition - , all mutations will be defined in separate files extending this type  */
export type Query = {
  __typename?: "Query";
  /** IGNORE: Dummy field necessary for the Query type to be valid */
  _empty?: Maybe<Scalars["String"]["output"]>;
  communitiesForCurrentEndUser?: Maybe<Array<Maybe<Community>>>;
  communityById?: Maybe<Community>;
  currentCommunity?: Maybe<Community>;
  currentEndUserAndCreateIfNotExists: EndUser;
  endUserById?: Maybe<EndUser>;
  hello?: Maybe<Scalars["String"]["output"]>;
  membersForCurrentEndUser: Array<Member>;
};

/**  Base Query Type definition - , all mutations will be defined in separate files extending this type  */
export type QueryCommunityByIdArgs = {
  id: Scalars["ObjectID"]["input"];
};

/**  Base Query Type definition - , all mutations will be defined in separate files extending this type  */
export type QueryEndUserByIdArgs = {
  id: Scalars["ObjectID"]["input"];
};

export type LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsQueryVariables =
  Exact<{ [key: string]: never }>;

export type LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsQuery = {
  __typename?: "Query";
  currentEndUserAndCreateIfNotExists: {
    __typename?: "EndUser";
    externalId?: string | null;
    id: any;
    personalInformation?: {
      __typename?: "EndUserPersonalInformation";
      identityDetails?: {
        __typename?: "EndUserIdentityDetails";
        lastName: string;
        restOfName?: string | null;
      } | null;
    } | null;
  };
};

export type LoggedInUserContainerEndUserFieldsFragment = {
  __typename?: "EndUser";
  externalId?: string | null;
  id: any;
  personalInformation?: {
    __typename?: "EndUserPersonalInformation";
    identityDetails?: {
      __typename?: "EndUserIdentityDetails";
      lastName: string;
      restOfName?: string | null;
    } | null;
  } | null;
};

export const LoggedInUserContainerEndUserFieldsFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "LoggedInUserContainerEndUserFields" },
      typeCondition: {
        kind: "NamedType",
        name: { kind: "Name", value: "EndUser" },
      },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "externalId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "personalInformation" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "identityDetails" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "lastName" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "restOfName" },
                      },
                    ],
                  },
                },
              ],
            },
          },
          { kind: "Field", name: { kind: "Name", value: "id" } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  LoggedInUserContainerEndUserFieldsFragment,
  unknown
>;
export const LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsDocument =
  {
    kind: "Document",
    definitions: [
      {
        kind: "OperationDefinition",
        operation: "query",
        name: {
          kind: "Name",
          value: "LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExists",
        },
        selectionSet: {
          kind: "SelectionSet",
          selections: [
            {
              kind: "Field",
              name: {
                kind: "Name",
                value: "currentEndUserAndCreateIfNotExists",
              },
              selectionSet: {
                kind: "SelectionSet",
                selections: [
                  {
                    kind: "FragmentSpread",
                    name: {
                      kind: "Name",
                      value: "LoggedInUserContainerEndUserFields",
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        kind: "FragmentDefinition",
        name: { kind: "Name", value: "LoggedInUserContainerEndUserFields" },
        typeCondition: {
          kind: "NamedType",
          name: { kind: "Name", value: "EndUser" },
        },
        selectionSet: {
          kind: "SelectionSet",
          selections: [
            { kind: "Field", name: { kind: "Name", value: "externalId" } },
            {
              kind: "Field",
              name: { kind: "Name", value: "personalInformation" },
              selectionSet: {
                kind: "SelectionSet",
                selections: [
                  {
                    kind: "Field",
                    name: { kind: "Name", value: "identityDetails" },
                    selectionSet: {
                      kind: "SelectionSet",
                      selections: [
                        {
                          kind: "Field",
                          name: { kind: "Name", value: "lastName" },
                        },
                        {
                          kind: "Field",
                          name: { kind: "Name", value: "restOfName" },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            { kind: "Field", name: { kind: "Name", value: "id" } },
          ],
        },
      },
    ],
  } as unknown as DocumentNode<
    LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsQuery,
    LoggedInUserRootContainerCurrentEndUserAndCreateIfNotExistsQueryVariables
  >;
