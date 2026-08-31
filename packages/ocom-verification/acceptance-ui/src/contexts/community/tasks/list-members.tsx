import { Render } from '@cellix/serenity-framework/dom/render-in-dom';
import { MemberList } from '../../../../../../ocom/ui-community-route-admin/src/components/members-list.tsx';
import type { AdminMemberListContainerMemberFieldsFragment } from '../../../../../../ocom/ui-community-route-admin/src/generated.tsx';
import { wrapOcomComponent } from '../../../shared/ocom-component-wrapper.ts';

export const ListMembers = (memberNames: string[]) => {
	const members: AdminMemberListContainerMemberFieldsFragment[] = memberNames.map((memberName, index) => ({
		id: `member-${index}-${memberName.toLowerCase().replaceAll(' ', '-')}`,
		memberName,
		isAdmin: false,
		accounts: [],
		profile: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	}));

	return Render.component(<MemberList data={members} />, { wrapper: wrapOcomComponent() });
};
