# E2E Test Writing

Use this guide for browser-backed Cucumber Screenplay tests with Playwright.

## Step Definitions

- Authenticate in a `Given` step with a domain-specific task or ability.
- Store the last actor name for follow-up assertions.
- Parse table inputs with `GherkinDataTable`.
- Catch expected validation failures only when the scenario is an "attempts to" negative path, then store the error in notes.

```ts
Given('{word} is an authenticated community owner', async (actorName: string) => {
  lastActorName = actorName;
  const actor = actorCalled(actorName);
  await actor.attemptsTo(LogInWithOAuth2(actors.CommunityOwner.email));
});
```

## Browser Tasks

- Use `BrowseTheWeb.withActor(actor)` to access the Playwright page.
- Navigate by app route, not by hard-coded host, so the portal base URL from infrastructure applies.
- Use shared page objects through `PlaywrightPageAdapter`.
- For shared page object design, read `../page-objects/pattern.md`.
- Wait for network responses or visible UI states that prove the business action completed.
- Record success, failure, and error messages in notes.

```ts
export const CreateCommunity = (name: string) =>
  Interaction.where(the`#actor creates community "${name}" via UI`, async (serenityActor) => {
    const actor = serenityActor as unknown as Actor;
    const { page } = BrowseTheWeb.withActor(actor);

    await page.goto('/community/accounts/create-community', { waitUntil: 'networkidle' });
    const communityPage = new CommunityPage(new PlaywrightPageAdapter(page));

    await communityPage.fillName(name);
    const response = page.waitForResponse(hasGraphqlOperation('AccountsCommunityCreateContainerCommunityCreate'));
    await communityPage.clickCreate();

    await response;
    await page.getByRole('cell', { name, exact: true }).first().waitFor({ state: 'visible' });
    await actor.attemptsTo(
      notes<CommunityE2ENotes>().set('communityName', name),
      notes<CommunityE2ENotes>().set('communityCreated', true),
      notes<CommunityE2ENotes>().set('errorMessage', null),
    );
  });
```

## OAuth2 Ability

- Model login as an app-specific Serenity ability.
- Trigger the OIDC redirect by navigating to a protected route.
- Fill the mock OAuth2 login form only when the browser is on `/login`.
- Wait until the redirect chain is no longer on the auth host or callback path.
- Keep credentials in shared test data or mock user config; do not hard-code production credentials.

## Questions

- Use `Question.about` to read actor notes for simple scenario outcomes.
- Prefer browser-visible assertions for user-facing state.
- Keep error-message questions tolerant of whether the error came from client validation, toast text, or GraphQL payload, but assert that the scenario actually observed a failure.

## Negative Paths

- Check for fast client-side validation before waiting on network responses.
- If a GraphQL response arrives, inspect HTTP status, GraphQL errors, domain status objects, and returned entity values.
- For failed mutations, store `communityCreated: false` and the best available error message before throwing or returning.

## Boundaries

- Do not use `DomPageAdapter`, `RenderInDom`, or component wrappers in E2E.
- Do not put server startup in step definitions; use infrastructure.
- Do not depend on arbitrary sleeps when a route change, response, selector, or toast can be awaited.
