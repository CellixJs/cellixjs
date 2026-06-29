# Page Object Pattern

Use this guide when creating or changing shared page objects for Serenity tests. The PR #267 model is the `@cellix/serenity-framework/pages` package plus shared verification pages such as `CommunityPage` and `HomePage`.

## Purpose

Page objects hide selector details behind business-readable methods and element properties. In CellixJS Serenity tests, page objects must be runtime-neutral so the same class can run in:

- DOM/component acceptance tests through `DomPageAdapter`
- Browser E2E tests through `PlaywrightPageAdapter`

## Core Rule

Depend on `PageAdapter`, never directly on happy-dom, jsdom, Playwright, React Testing Library, or a raw browser page inside shared page objects.

```ts
import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

export class CommunityPage extends AdapterBackedPageObject {
  get nameInput(): ElementHandle {
    return this.adapter.getByPlaceholder('Name');
  }

  get submitButton(): ElementHandle {
    return this.adapter.getByRole('button', { name: /Create/i });
  }

  get firstValidationError(): ElementHandle {
    return this.adapter.locator('.ant-form-item-explain-error');
  }

  async fillName(value: string): Promise<void> {
    await this.nameInput.fill(value);
  }

  async clickCreate(): Promise<void> {
    await this.submitButton.click();
  }
}
```

## Where Code Belongs

- Put reusable page objects in the shared verification package when acceptance UI and E2E both use the same page or component language.
- Put suite-specific page contracts in the consumer suite when a suite needs only a subset of the shared page object.
- Put adapter construction at the test edge: tasks, interactions, or step helpers create `DomPageAdapter` or `PlaywrightPageAdapter`.
- Keep app-specific selectors in page objects, not in step definitions.
- Keep business flow orchestration in tasks/interactions, not in page objects.

## Adapter Usage

DOM/component acceptance:

```ts
const page = new CommunityPage(new DomPageAdapter(RenderInDom.as(actor).container));
await page.fillName(name);
await page.clickCreate();
```

Browser E2E:

```ts
const { page: playwrightPage } = BrowseTheWeb.withActor(actor);
const communityPage = new CommunityPage(new PlaywrightPageAdapter(playwrightPage));
await communityPage.fillName(name);
await communityPage.clickCreate();
```

## Element Selection

Prefer selectors in this order:

1. Accessible role and name: `getByRole('button', { name: /Create/i })`
2. Visible label or placeholder: `getByLabel('Name')`, `getByPlaceholder('Name')`
3. User-visible text: `getByText(/Saved/i)`
4. Stable CSS selector for framework-generated or validation elements: `locator('.ant-form-item-explain-error')`

Avoid brittle selectors based on implementation-only structure, generated class names, nth-child position, or text that is incidental to layout rather than behavior.

## Page Contracts

Use `Pick` contracts in suite packages when a task should depend on only the operations it needs:

```ts
import type { CommunityPage } from '@ocom-verification/verification-shared/pages';

export type E2ECommunityPage = Pick<
  CommunityPage,
  'fillName' | 'clickCreate' | 'firstValidationError' | 'errorToast'
>;
```

This keeps tasks honest without forcing separate page-object classes for each suite.

## Runtime Differences

- `DomPageAdapter` scopes selectors to the rendered component container.
- `DomElementHandle` treats missing elements as inert for `fill`, `click`, and `check`; assert `isVisible()` or read `textContent()` before trusting a selector in DOM tests.
- `PlaywrightPageAdapter` wraps Playwright locators and may throw or wait when elements are missing, depending on the operation.
- Do not encode these runtime differences inside shared page objects. Handle waits and assertions in tasks/questions where the suite context is known.

## Do And Do Not

- Do expose named element getters for important controls and messages.
- Do expose short action methods for common page operations.
- Do keep methods at the page interaction level, such as `fillName` or `clickCreate`.
- Do let tasks combine page methods, waits, network expectations, and actor notes.
- Do not import `BrowseTheWeb`, `RenderInDom`, `DomPageAdapter`, or `PlaywrightPageAdapter` into shared page objects.
- Do not make page objects own scenario state.
- Do not put assertions that belong to Cucumber then-steps or Serenity questions inside page action methods.
