import { Render, RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { DomPageAdapter } from '@cellix/serenity-framework/pages/dom';
import { TaskStep } from '@cellix/serenity-framework/serenity';
import { BillingPage, CommunityPage } from '@ocom-verification/verification-shared/pages';
import { type Actor, Task, type UsesAbilities } from '@serenity-js/core';
import { act } from '@testing-library/react';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';
import type { AcceptanceUiBillingPage, AcceptanceUiCommunityPage } from '../../../shared/page-contracts.ts';
import { createBillingHarnessElement } from '../abilities/mock-billing-backend.ts';

export async function flushCommunityUi(): Promise<void> {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
}

export function communityPageFor(actor: UsesAbilities): AcceptanceUiCommunityPage {
	return new CommunityPage(new DomPageAdapter(RenderInDom.as(actor).container));
}

export function billingPageFor(actor: UsesAbilities): AcceptanceUiBillingPage {
	return new BillingPage(new DomPageAdapter(RenderInDom.as(actor).container));
}

export function billingFeedbackPage(): AcceptanceUiBillingPage {
	return new BillingPage(new DomPageAdapter(document.body));
}

export const RenderCommunityBilling = (): Task =>
	Task.where(
		'#actor opens community billing',
		new TaskStep<Actor>('#actor renders the community billing screen', async (actor) => {
			await actor.attemptsTo(Render.component(createBillingHarnessElement(), { wrapper: wrapOcomComponent() }));
			await flushCommunityUi();
		}),
	);
