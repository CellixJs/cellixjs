import type { FragmentDefinitionNode, GraphQLResolveInfo, SelectionSetNode  } from 'graphql';

export function getRequestedFieldPaths(info: GraphQLResolveInfo): string[] {
  const out = new Set<string>();
  const node = info.fieldNodes[0];
  collectFieldPaths(node?.selectionSet, info.fragments, out);
  return Array.from(out);
}

/**
 * Recursively collects all leaf field paths from a GraphQL selection set.
 * Delegates handling of each selection type to specialized helper functions for maintainability.
 *
 * Args:
 *   selectionSet: The current selection set node.
 *   fragments: A map of fragment definitions.
 *   out: A set to accumulate the resulting field paths.
 *   parentPath: The current dot-separated path prefix.
 */
function collectFieldPaths(
  selectionSet: SelectionSetNode | undefined,
  fragments: Record<string, FragmentDefinitionNode>,
  out: Set<string>,
  parentPath = ''
) {
  if (!selectionSet) { return; }

  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case 'Field':
        handleFieldSelection(selection, fragments, out, parentPath);
        break;
      case 'FragmentSpread':
        handleFragmentSpread(selection, fragments, out, parentPath);
        break;
      case 'InlineFragment':
        handleInlineFragment(selection, fragments, out, parentPath);
        break;
    }
  }
}

/**
 * Handles a Field selection node, recursing into sub-selections or adding leaf paths.
 */
function handleFieldSelection(
  selection: Extract<SelectionSetNode['selections'][number], { kind: 'Field' }>,
  fragments: Record<string, FragmentDefinitionNode>,
  out: Set<string>,
  parentPath: string
) {
  const name = selection.name.value;
  if (name === '__typename') { return; }

  const path = parentPath ? `${parentPath}.${name}` : name;

  if (selection.selectionSet) {
    collectFieldPaths(selection.selectionSet, fragments, out, path);
  } else {
    out.add(path);
  }
}

/**
 * Handles a FragmentSpread selection node by recursing into the referenced fragment.
 */
function handleFragmentSpread(
  selection: Extract<SelectionSetNode['selections'][number], { kind: 'FragmentSpread' }>,
  fragments: Record<string, FragmentDefinitionNode>,
  out: Set<string>,
  parentPath: string
) {
  const fragment = fragments[selection.name.value];
  if (fragment) {
    collectFieldPaths(fragment.selectionSet, fragments, out, parentPath);
  }
}

/**
 * Handles an InlineFragment selection node by recursing into its selection set.
 */
function handleInlineFragment(
  selection: Extract<SelectionSetNode['selections'][number], { kind: 'InlineFragment' }>,
  fragments: Record<string, FragmentDefinitionNode>,
  out: Set<string>,
  parentPath: string
) {
  collectFieldPaths(selection.selectionSet, fragments, out, parentPath);
}
