import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberUpdateCommand {
memberId: string;
updates: {
firstName?: string;
lastName?: string;
email?: string;
};
}

export const updateMember = (dataSources: DataSources) => {
return async (command: MemberUpdateCommand): Promise<void> => {
const { memberId, updates } = command;

// Get the member data source
const memberDataSource = await dataSources.members;

// Find the member
const member = await memberDataSource.findById(memberId);

if (!member) {
throw new Error(`Member not found: ${memberId}`);
}

// Update the member's accounts (first account)
if (member.accounts && member.accounts.length > 0) {
const account = member.accounts[0];

if (updates.firstName !== undefined) {
account.firstName = updates.firstName;
}
if (updates.lastName !== undefined) {
account.lastName = updates.lastName;
}
}

// Update profile email if provided
if (updates.email !== undefined) {
if (!member.profile) {
member.profile = { email: updates.email } as typeof member.profile;
} else {
member.profile.email = updates.email;
}
}

// Save the member
await memberDataSource.save(member);
};
};
