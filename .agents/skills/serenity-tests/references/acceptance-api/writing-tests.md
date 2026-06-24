# Acceptance API Test Writing

Use this guide for API-only Cucumber Screenplay scenarios. API acceptance verifies application behavior through APIs and domain services without a browser.

## Step Definitions

- Keep Cucumber steps thin: resolve the actor, parse data tables, run tasks, and answer questions.
- Use `actorCalled(name)` to create or retrieve the actor.
- Store the last actor name when later steps omit an actor.
- Use `GherkinDataTable.from(dataTable).rowsHash<T>()` for typed input.
- Use `ActorName.resolve` in assertions that can refer to a named actor or the last actor.

```ts
When('{word} creates a community with:', async (actorName: string, dataTable: DataTable) => {
  lastActorName = actorName;
  const actor = actorCalled(actorName);
  const details = GherkinDataTable.from(dataTable).rowsHash<CommunityDetails>();

  await actor.attemptsTo(CreateCommunity.with(details));
});
```

## Tasks

- Use a class extending `Task` when the task has reusable factories or meaningful state.
- Use domain abilities for API actions. Do not put GraphQL request details directly in step definitions.
- Store observable scenario state in actor notes.

```ts
export class CreateCommunity extends Task {
  static with(details: CommunityDetails) {
    return new CreateCommunity(details);
  }

  private constructor(private readonly details: CommunityDetails) {
    super(`creates a community named "${details.name}"`);
  }

  async performAs(actor: Actor): Promise<void> {
    const community = await CreateCommunityAbility.as(actor).performAs(actor, this.details);
    await actor.attemptsTo(
      notes<CommunityNotes>().set('lastCommunityId', community.id ?? ''),
      notes<CommunityNotes>().set('lastCommunityName', community.name),
      notes<CommunityNotes>().set('lastCommunityStatus', 'SUCCESS'),
    );
  }
}
```

## Questions

- Use `Question` for observable assertions.
- Prefer reading from the system under test, falling back to actor notes only when no system read is available.
- Fail with a diagnostic error if prerequisite state is missing.

```ts
export class CommunityName extends Question<Promise<string>> {
  static displayed(): CommunityName {
    return new CommunityName();
  }

  override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<string> {
    const communityId = await readNote(actor, 'lastCommunityId');
    const apiName = communityId ? await readNameFromApi(actor, communityId) : undefined;
    if (apiName) return apiName;

    const notedName = await readNote(actor, 'lastCommunityName');
    if (!notedName) throw new Error('No community name found. Did the actor create a community first?');
    return notedName;
  }
}
```

## Validation And Negative Paths

- For invalid actions, clear stale success/error notes before attempting the task.
- Catch expected domain or API validation failures in the step, then store the message in notes.
- Assertions should verify that no success note or created ID was recorded.
- Do not let negative-path scenarios pass merely because a task threw; assert the specific observable validation state.

## Boundaries

- Put feature files and reusable test data in shared verification packages when API, UI, and E2E suites share the scenario language.
- Put API-specific abilities, GraphQL operations, server setup, and step definitions in `acceptance-api`.
- Do not import UI page objects or Playwright in API acceptance tests.
