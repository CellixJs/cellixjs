import type { ElementHandle } from '@cellix/serenity-framework/pages';
import { PropertiesListPage } from './properties-list.page.ts';

/**
 * Page contract for the member directory. It shares table interactions with
 * the manager directory but deliberately does not expose owner-column APIs.
 */
export class MemberPropertiesListPage extends PropertiesListPage {
	override get heading(): ElementHandle {
		return this.adapter.getByText(/Community Properties \(/);
	}
}
