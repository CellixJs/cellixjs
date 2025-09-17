import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { getRequestedFieldPaths } from './resolver-helper.ts';
import { type GraphQLResolveInfo, type FragmentDefinitionNode, type FieldNode, type SelectionSetNode, Kind } from 'graphql';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'resolver-helper.feature')
);

function makeInfo({
  selections,
  fragments = {},
}: {
  selections: SelectionSetNode['selections'],
  fragments?: Record<string, FragmentDefinitionNode>
}): GraphQLResolveInfo {
  return {
    fieldNodes: [{
      kind: 'Field',
      name: { kind: 'Name', value: 'dummy' },
      selectionSet: {
        kind: 'SelectionSet',
        selections,
      },
    } as FieldNode],
    fragments,
  } as unknown as GraphQLResolveInfo;
}

describeFeature(feature, ({ Scenario }) => {
  Scenario('Extracting simple top-level fields', ({ Given, When, Then }) => {
    let info: GraphQLResolveInfo;
    let result: string[];

    Given('a GraphQLResolveInfo for a query requesting "id" and "name"', () => {
      info = makeInfo({
        selections: [
          { kind: Kind.FIELD, name: { kind: Kind.NAME, value: 'id' } },
          { kind: Kind.FIELD, name: { kind: Kind.NAME, value: 'name' } },
        ],
      });
    });

    When('getRequestedFieldPaths is called', () => {
      result = getRequestedFieldPaths(info);
    });

    Then('it should return ["id", "name"]', () => {
      expect(result.sort()).toEqual(['id', 'name']);
    });
  });

  Scenario('Extracting nested fields', ({ Given, When, Then }) => {
    let info: GraphQLResolveInfo;
    let result: string[];

    Given('a GraphQLResolveInfo for a query requesting "user { id name }"', () => {
      info = makeInfo({
        selections: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'user' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                { kind: Kind.FIELD, name: { kind: Kind.NAME, value: 'id' } },
                { kind: Kind.FIELD, name: { kind: Kind.NAME, value: 'name' } },
              ],
            },
          },
        ],
      });
    });

    When('getRequestedFieldPaths is called', () => {
      result = getRequestedFieldPaths(info);
    });

    Then('it should return ["user.id", "user.name"]', () => {
      expect(result.sort()).toEqual(['user.id', 'user.name']);
    });
  });

  Scenario('Extracting fields with fragments', ({ Given, When, Then }) => {
    let info: GraphQLResolveInfo;
    let result: string[];

    Given('a GraphQLResolveInfo for a query requesting "user { ...UserFields }" and fragment "fragment UserFields on User { id name }"', () => {
      info = makeInfo({
        selections: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'user' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                { kind: Kind.FRAGMENT_SPREAD, name: { kind: Kind.NAME, value: 'UserFields' } },
              ],
            },
          },
        ],
        fragments: {
          UserFields: {
            kind: Kind.FRAGMENT_DEFINITION,
            name: { kind: Kind.NAME, value: 'UserFields' },
            typeCondition: { kind: Kind.NAMED_TYPE, name: { kind: Kind.NAME, value: 'User' } },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                { kind: Kind.FIELD, name: { kind: Kind.NAME, value: 'id' } },
                { kind: Kind.FIELD, name: { kind: Kind.NAME, value: 'name' } },
              ],
            },
          },
        },
      });
    });

    When('getRequestedFieldPaths is called', () => {
      result = getRequestedFieldPaths(info);
    });

    Then('it should return ["user.id", "user.name"]', () => {
      expect(result.sort()).toEqual(['user.id', 'user.name']);
    });
  });

  Scenario('Extracting fields with inline fragments', ({ Given, When, Then }) => {
    let info: GraphQLResolveInfo;
    let result: string[];

    Given('a GraphQLResolveInfo for a query requesting "user { ... on User { id name } }"', () => {
      info = makeInfo({
        selections: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'user' },
            selectionSet: {
              kind: Kind.SELECTION_SET,
              selections: [
                {
                  kind: Kind.INLINE_FRAGMENT,
                  typeCondition: { kind: Kind.NAMED_TYPE, name: { kind: Kind.NAME, value: 'User' } },
                  selectionSet: {
                    kind: Kind.SELECTION_SET,
                    selections: [
                      { kind: Kind.FIELD, name: { kind: Kind.NAME, value: 'id' } },
                      { kind: Kind.FIELD, name: { kind: Kind.NAME, value: 'name' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });
    });

    When('getRequestedFieldPaths is called', () => {
      result = getRequestedFieldPaths(info);
    });

    Then('it should return ["user.id", "user.name"]', () => {
      expect(result.sort()).toEqual(['user.id', 'user.name']);
    });
  });

  Scenario('Skipping __typename meta field', ({ Given, When, Then }) => {
    let info: GraphQLResolveInfo;
    let result: string[];

    Given('a GraphQLResolveInfo for a query requesting "id" and "__typename"', () => {
      info = makeInfo({
        selections: [
          { kind: Kind.FIELD, name: { kind: Kind.NAME, value: 'id' } },
          { kind: Kind.FIELD, name: { kind: Kind.NAME, value: '__typename' } },
        ],
      });
    });

    When('getRequestedFieldPaths is called', () => {
      result = getRequestedFieldPaths(info);
    });

    Then('it should return ["id"]', () => {
      expect(result).toEqual(['id']);
    });
  });
});