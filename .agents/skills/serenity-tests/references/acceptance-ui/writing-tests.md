# Acceptance UI Test Writing

Use this guide for in-process DOM/component Cucumber Screenplay tests.

## Step Definitions

- Render the component in a `Given` step through the actor using `Render.component`.
- Configure callbacks so component output can be observed through actor notes.
- Parse table inputs with `GherkinDataTable`.
- Use `actorInTheSpotlight()` for follow-up assertions when the scenario naturally tracks the active actor.

```tsx
Given('{word} is an authenticated community owner', async (actorName: string) => {
  const actor = actorCalled(actorName);

  const onSave = async (values: { name: string }) => {
    await actor.attemptsTo(
      notes<CommunityUiNotes>().set('formSubmitted', true),
      notes<CommunityUiNotes>().set('communityName', values.name ?? ''),
    );
  };

  await actor.attemptsTo(
    notes<CommunityUiNotes>().set('formSubmitted', false),
    notes<CommunityUiNotes>().set('communityName', ''),
    Render.component(<CommunityCreate onSave={onSave} />, { wrapper: wrapOcomComponent() }),
  );
});
```

## Tasks

- Use `Task.where` with `TaskStep` for concise task definitions.
- Build page objects from `new DomPageAdapter(RenderInDom.as(actor).container)`.
- Let pending React work settle after actions that trigger async form handlers.

```ts
export const CreateCommunity = (name: string): Task =>
  Task.where(
    `#actor creates a community named "${name}"`,
    new TaskStep<Actor>(`#actor fills the community name "${name}" and submits`, async (actor) => {
      const page = new CommunityPage(new DomPageAdapter(RenderInDom.as(actor).container));
      await page.fillName(name);
      await page.clickCreate();
      await flushPendingReactWork();
    }),
  );
```

Use a short `flushPendingReactWork` helper when the component relies on async `onFinish`, state updates, or Apollo mock resolution.

## Questions And Assertions

- Use `Question.about` for simple note reads.
- Use page objects for DOM-visible validation errors.
- Assert actual component behavior, not implementation internals.

```ts
export const CommunityCreatedFlag = () =>
  Question.about('whether the community form was submitted', (actor) =>
    actor.answer(notes<CommunityUiNotes>().get('formSubmitted')),
  );
```

For validation errors, instantiate the page through `DomPageAdapter` and read the visible error text. Check both field-specific wording and a validation-wording fallback.

## Page Objects

- Reuse shared page objects when the component and browser suites express the same user workflow.
- Page objects should depend on `PageAdapter`, not happy-dom directly.
- Add UI-suite page contract types when acceptance UI only needs a subset of a shared page object's full browser contract.
- For the full cross-runtime pattern, read `../page-objects/pattern.md`.

## Boundaries

- Do not start API, auth, proxy, or browser processes in acceptance UI tests.
- Do not import Playwright or `BrowseTheWeb`.
- Do not query the real network. Use component callbacks, Apollo mocks, provider fakes, and actor notes.
- Keep CSS and asset handling in preloads, not in step definitions.
