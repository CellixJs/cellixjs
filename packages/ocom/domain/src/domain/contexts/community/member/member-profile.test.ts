import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';
import { MemberProfile, type MemberProfileProps } from './member-profile.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/member-profile.feature'),
);

function makeVisa(
	overrides: Partial<{
		canManageMembers: boolean;
		canEditOwnMemberProfile: boolean;
		isEditingOwnMemberAccount: boolean;
	}> = {},
) {
	return vi.mocked({
		determineIf: (
			fn: (p: {
				canManageMembers: boolean;
				canEditOwnMemberProfile: boolean;
				isEditingOwnMemberAccount: boolean;
			}) => boolean,
		) =>
			fn({
				canManageMembers: overrides.canManageMembers ?? true,
				canEditOwnMemberProfile: overrides.canEditOwnMemberProfile ?? false,
				isEditingOwnMemberAccount: overrides.isEditingOwnMemberAccount ?? false,
			}),
	});
}

function makeProps(
	overrides: Partial<MemberProfileProps> = {},
): MemberProfileProps {
	return {
		name: 'Alice',
		email: 'alice@example.com',
		bio: 'Hello!',
		avatarDocumentId: 'doc-1',
		interests: ['reading'],
		showInterests: true,
		showEmail: true,
		showProfile: true,
		showLocation: true,
		showProperties: true,
		...overrides,
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let visa: ReturnType<typeof makeVisa>;
	let props: MemberProfileProps;
	let entity: MemberProfile;

	BeforeEachScenario(() => {
		visa = makeVisa();
		props = makeProps();
		entity = new MemberProfile(props, visa);
	});

	Background(({ Given, And }) => {
		Given(
			'valid MemberProfileProps with name "Alice", email "alice@example.com", bio "Hello!", avatarDocumentId "doc-1", interests ["reading"], showInterests true, showEmail true, showProfile true, showLocation true, showProperties true',
			() => {
				props = makeProps();
			},
		);
		And('a valid CommunityVisa', () => {
			visa = makeVisa();
		});
	});

	Scenario(
		'Getting name, email, bio, avatarDocumentId, interests, showInterests, showEmail, showProfile, showLocation, and showProperties',
		({ Given, Then, And }) => {
			Given('a MemberProfile entity', () => {
				entity = new MemberProfile(props, visa);
			});
			Then('the name property should return "Alice"', () => {
				expect(entity.name).toBe('Alice');
			});
			And('the email property should return "alice@example.com"', () => {
				expect(entity.email).toBe('alice@example.com');
			});
			And('the bio property should return "Hello!"', () => {
				expect(entity.bio).toBe('Hello!');
			});
			And('the avatarDocumentId property should return "doc-1"', () => {
				expect(entity.avatarDocumentId).toBe('doc-1');
			});
			And('the interests property should return ["reading"]', () => {
				expect(entity.interests).toEqual(['reading']);
			});
			And('the showInterests property should return true', () => {
				expect(entity.showInterests).toBe(true);
			});
			And('the showEmail property should return true', () => {
				expect(entity.showEmail).toBe(true);
			});
			And('the showProfile property should return true', () => {
				expect(entity.showProfile).toBe(true);
			});
			And('the showLocation property should return true', () => {
				expect(entity.showLocation).toBe(true);
			});
			And('the showProperties property should return true', () => {
				expect(entity.showProperties).toBe(true);
			});
		},
	);

	Scenario(
		'Changing name with permission to manage members',
		({ Given, When, Then }) => {
			Given('a MemberProfile entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberProfile(makeProps(), visa);
			});
			When('I set the name to "Bob"', () => {
				entity.name = 'Bob';
			});
			Then('the name property should return "Bob"', () => {
				expect(entity.name).toBe('Bob');
			});
		},
	);

	Scenario(
		'Changing name with permission to edit own member profile and is editing own member account',
		({ Given, When, Then }) => {
			Given(
				'a MemberProfile entity with permission to edit own member profile and is editing own member account',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I set the name to "Bob"', () => {
				entity.name = 'Bob';
			});
			Then('the name property should return "Bob"', () => {
				expect(entity.name).toBe('Bob');
			});
		},
	);

	Scenario('Changing name without permission', ({ Given, When, Then }) => {
		let setName: () => void;
		Given(
			'a MemberProfile entity without permission to manage members or edit own member profile',
			() => {
				visa = makeVisa({
					canManageMembers: false,
					canEditOwnMemberProfile: false,
					isEditingOwnMemberAccount: false,
				});
				entity = new MemberProfile(makeProps(), visa);
			},
		);
		When('I try to set the name to "Bob"', () => {
			setName = () => {
				entity.name = 'Bob';
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setName).toThrow(PermissionError);
			expect(setName).throws(
				'You do not have permission to update this profile',
			);
		});
	});

	Scenario('Changing name to an invalid value', ({ Given, When, Then }) => {
		let setNameInvalid: () => void;
		Given('a MemberProfile entity with permission to manage members', () => {
			visa = makeVisa({ canManageMembers: true });
			entity = new MemberProfile(makeProps(), visa);
		});
		When(
			'I try to set the name to an invalid value (e.g., null or empty string)',
			() => {
				setNameInvalid = () => {
					// @ts-expect-error
					entity.name = null;
				};
			},
		);
		Then('an error should be thrown indicating the value is invalid', () => {
			expect(setNameInvalid).throws('Wrong raw value type');
		});
	});

	Scenario(
		'Changing email with permission to manage members',
		({ Given, When, Then }) => {
			Given('a MemberProfile entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberProfile(makeProps(), visa);
			});
			When('I set the email to "bob@example.com"', () => {
				entity.email = 'bob@example.com';
			});
			Then('the email property should return "bob@example.com"', () => {
				expect(entity.email).toBe('bob@example.com');
			});
		},
	);

	Scenario(
		'Changing email with permission to edit own member profile and is editing own member account',
		({ Given, When, Then }) => {
			Given(
				'a MemberProfile entity with permission to edit own member profile and is editing own member account',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I set the email to "bob@example.com"', () => {
				entity.email = 'bob@example.com';
			});
			Then('the email property should return "bob@example.com"', () => {
				expect(entity.email).toBe('bob@example.com');
			});
		},
	);

	Scenario('Changing email without permission', ({ Given, When, Then }) => {
		let setEmail: () => void;
		Given(
			'a MemberProfile entity without permission to manage members or edit own member profile',
			() => {
				visa = makeVisa({
					canManageMembers: false,
					canEditOwnMemberProfile: false,
					isEditingOwnMemberAccount: false,
				});
				entity = new MemberProfile(makeProps(), visa);
			},
		);
		When('I try to set the email to "bob@example.com"', () => {
			setEmail = () => {
				entity.email = 'bob@example.com';
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setEmail).toThrow(PermissionError);
			expect(setEmail).throws(
				'You do not have permission to update this profile',
			);
		});
	});

	Scenario('Changing email to an invalid value', ({ Given, When, Then }) => {
		let setEmailInvalid: () => void;
		Given('a MemberProfile entity with permission to manage members', () => {
			visa = makeVisa({ canManageMembers: true });
			entity = new MemberProfile(makeProps(), visa);
		});
		When(
			'I try to set the email to an invalid value (e.g., "not-an-email")',
			() => {
				setEmailInvalid = () => {
					entity.email = 'not-an-email';
				};
			},
		);
		Then('an error should be thrown indicating the value is invalid', () => {
			expect(setEmailInvalid).throws("Value doesn't match pattern");
		});
	});

	Scenario(
		'Changing bio with permission to manage members',
		({ Given, When, Then }) => {
			Given('a MemberProfile entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberProfile(makeProps(), visa);
			});
			When('I set the bio to "New bio"', () => {
				entity.bio = 'New bio';
			});
			Then('the bio property should return "New bio"', () => {
				expect(entity.bio).toBe('New bio');
			});
		},
	);

	Scenario(
		'Changing bio with permission to edit own member profile and is editing own member account',
		({ Given, When, Then }) => {
			Given(
				'a MemberProfile entity with permission to edit own member profile and is editing own member account',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I set the bio to "New bio"', () => {
				entity.bio = 'New bio';
			});
			Then('the bio property should return "New bio"', () => {
				expect(entity.bio).toBe('New bio');
			});
		},
	);

	Scenario('Changing bio without permission', ({ Given, When, Then }) => {
		let setBio: () => void;
		Given(
			'a MemberProfile entity without permission to manage members or edit own member profile',
			() => {
				visa = makeVisa({
					canManageMembers: false,
					canEditOwnMemberProfile: false,
					isEditingOwnMemberAccount: false,
				});
				entity = new MemberProfile(makeProps(), visa);
			},
		);
		When('I try to set the bio to "New bio"', () => {
			setBio = () => {
				entity.bio = 'New bio';
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setBio).toThrow(PermissionError);
			expect(setBio).toThrow(
				'You do not have permission to update this profile',
			);
		});
	});

	Scenario('Changing bio to an invalid value', ({ Given, When, Then }) => {
		let setBioInvalid: () => void;
		Given('a MemberProfile entity with permission to manage members', () => {
			visa = makeVisa({ canManageMembers: true });
			entity = new MemberProfile(makeProps(), visa);
		});
		When(
			'I try to set the bio to an invalid value (e.g., a string longer than allowed)',
			() => {
				setBioInvalid = () => {
					entity.bio = 'a'.repeat(2001); // assuming max length is 1000
				};
			},
		);
		Then('an error should be thrown indicating the value is invalid', () => {
			expect(setBioInvalid).throws('Too long');
		});
	});

	Scenario(
		'Changing avatarDocumentId with permission to manage members',
		({ Given, When, Then }) => {
			Given('a MemberProfile entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberProfile(makeProps(), visa);
			});
			When('I set the avatarDocumentId to "doc-2"', () => {
				entity.avatarDocumentId = 'doc-2';
			});
			Then('the avatarDocumentId property should return "doc-2"', () => {
				expect(entity.avatarDocumentId).toBe('doc-2');
			});
		},
	);

	Scenario(
		'Changing avatarDocumentId with permission to edit own member profile and is editing own member account',
		({ Given, When, Then }) => {
			Given(
				'a MemberProfile entity with permission to edit own member profile and is editing own member account',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I set the avatarDocumentId to "doc-2"', () => {
				entity.avatarDocumentId = 'doc-2';
			});
			Then('the avatarDocumentId property should return "doc-2"', () => {
				expect(entity.avatarDocumentId).toBe('doc-2');
			});
		},
	);

	Scenario(
		'Changing avatarDocumentId without permission',
		({ Given, When, Then }) => {
			let setAvatar: () => void;
			Given(
				'a MemberProfile entity without permission to manage members or edit own member profile',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: false,
						isEditingOwnMemberAccount: false,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I try to set the avatarDocumentId to "doc-2"', () => {
				setAvatar = () => {
					entity.avatarDocumentId = 'doc-2';
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setAvatar).toThrow(PermissionError);
				expect(setAvatar).toThrow(
					'You do not have permission to update this profile',
				);
			});
		},
	);

	Scenario(
		'Changing interests with permission to manage members',
		({ Given, When, Then }) => {
			Given('a MemberProfile entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberProfile(makeProps(), visa);
			});
			When('I set the interests to ["sports", "music"]', () => {
				entity.interests = ['sports', 'music'];
			});
			Then('the interests property should return ["sports", "music"]', () => {
				expect(entity.interests).toEqual(['sports', 'music']);
			});
		},
	);

	Scenario(
		'Changing interests with permission to edit own member profile and is editing own member account',
		({ Given, When, Then }) => {
			Given(
				'a MemberProfile entity with permission to edit own member profile and is editing own member account',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I set the interests to ["sports", "music"]', () => {
				entity.interests = ['sports', 'music'];
			});
			Then('the interests property should return ["sports", "music"]', () => {
				expect(entity.interests).toEqual(['sports', 'music']);
			});
		},
	);

	Scenario('Changing interests without permission', ({ Given, When, Then }) => {
		let setInterests: () => void;
		Given(
			'a MemberProfile entity without permission to manage members or edit own member profile',
			() => {
				visa = makeVisa({
					canManageMembers: false,
					canEditOwnMemberProfile: false,
					isEditingOwnMemberAccount: false,
				});
				entity = new MemberProfile(makeProps(), visa);
			},
		);
		When('I try to set the interests to ["sports", "music"]', () => {
			setInterests = () => {
				entity.interests = ['sports', 'music'];
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setInterests).toThrow(PermissionError);
			expect(setInterests).toThrow(
				'You do not have permission to update this profile',
			);
		});
	});

	Scenario(
		'Changing interests to an invalid value',
		({ Given, When, Then }) => {
			let setInterestsInvalid: () => void;
			Given('a MemberProfile entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberProfile(makeProps(), visa);
			});
			When(
				'I try to set the interests to an invalid value (e.g., a string instead of array)',
				() => {
					setInterestsInvalid = () => {
						// @ts-expect-error
						entity.interests = 'not-an-array';
					};
				},
			);
			Then('an error should be thrown indicating the value is invalid', () => {
				expect(setInterestsInvalid).toThrow();
			});
		},
	);

	Scenario(
		'Changing showInterests with permission to manage members',
		({ Given, When, Then }) => {
			Given('a MemberProfile entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberProfile(makeProps(), visa);
			});
			When('I set showInterests to false', () => {
				entity.showInterests = false;
			});
			Then('the showInterests property should return false', () => {
				expect(entity.showInterests).toBe(false);
			});
		},
	);

	Scenario(
		'Changing showInterests with permission to edit own member profile and is editing own member account',
		({ Given, When, Then }) => {
			Given(
				'a MemberProfile entity with permission to edit own member profile and is editing own member account',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I set showInterests to false', () => {
				entity.showInterests = false;
			});
			Then('the showInterests property should return false', () => {
				expect(entity.showInterests).toBe(false);
			});
		},
	);

	Scenario(
		'Changing showInterests without permission',
		({ Given, When, Then }) => {
			let setShowInterests: () => void;
			Given(
				'a MemberProfile entity without permission to manage members or edit own member profile',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: false,
						isEditingOwnMemberAccount: false,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I try to set showInterests to false', () => {
				setShowInterests = () => {
					entity.showInterests = false;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setShowInterests).toThrow(PermissionError);
				expect(setShowInterests).toThrow(
					'You do not have permission to update this profile',
				);
			});
		},
	);

	Scenario(
		'Changing showEmail with permission to manage members',
		({ Given, When, Then }) => {
			Given('a MemberProfile entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberProfile(makeProps(), visa);
			});
			When('I set showEmail to false', () => {
				entity.showEmail = false;
			});
			Then('the showEmail property should return false', () => {
				expect(entity.showEmail).toBe(false);
			});
		},
	);

	Scenario(
		'Changing showEmail with permission to edit own member profile and is editing own member account',
		({ Given, When, Then }) => {
			Given(
				'a MemberProfile entity with permission to edit own member profile and is editing own member account',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I set showEmail to false', () => {
				entity.showEmail = false;
			});
			Then('the showEmail property should return false', () => {
				expect(entity.showEmail).toBe(false);
			});
		},
	);

	Scenario('Changing showEmail without permission', ({ Given, When, Then }) => {
		let setShowEmail: () => void;
		Given(
			'a MemberProfile entity without permission to manage members or edit own member profile',
			() => {
				visa = makeVisa({
					canManageMembers: false,
					canEditOwnMemberProfile: false,
					isEditingOwnMemberAccount: false,
				});
				entity = new MemberProfile(makeProps(), visa);
			},
		);
		When('I try to set showEmail to false', () => {
			setShowEmail = () => {
				entity.showEmail = false;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setShowEmail).toThrow(PermissionError);
			expect(setShowEmail).toThrow(
				'You do not have permission to update this profile',
			);
		});
	});

	Scenario(
		'Changing showProfile with permission to manage members',
		({ Given, When, Then }) => {
			Given('a MemberProfile entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberProfile(makeProps(), visa);
			});
			When('I set showProfile to false', () => {
				entity.showProfile = false;
			});
			Then('the showProfile property should return false', () => {
				expect(entity.showProfile).toBe(false);
			});
		},
	);

	Scenario(
		'Changing showProfile with permission to edit own member profile and is editing own member account',
		({ Given, When, Then }) => {
			Given(
				'a MemberProfile entity with permission to edit own member profile and is editing own member account',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I set showProfile to false', () => {
				entity.showProfile = false;
			});
			Then('the showProfile property should return false', () => {
				expect(entity.showProfile).toBe(false);
			});
		},
	);

	Scenario(
		'Changing showProfile without permission',
		({ Given, When, Then }) => {
			let setShowProfile: () => void;
			Given(
				'a MemberProfile entity without permission to manage members or edit own member profile',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: false,
						isEditingOwnMemberAccount: false,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I try to set showProfile to false', () => {
				setShowProfile = () => {
					entity.showProfile = false;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setShowProfile).toThrow(PermissionError);
				expect(setShowProfile).toThrow(
					'You do not have permission to update this profile',
				);
			});
		},
	);

	Scenario(
		'Changing showLocation with permission to manage members',
		({ Given, When, Then }) => {
			Given('a MemberProfile entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberProfile(makeProps(), visa);
			});
			When('I set showLocation to false', () => {
				entity.showLocation = false;
			});
			Then('the showLocation property should return false', () => {
				expect(entity.showLocation).toBe(false);
			});
		},
	);

	Scenario(
		'Changing showLocation with permission to edit own member profile and is editing own member account',
		({ Given, When, Then }) => {
			Given(
				'a MemberProfile entity with permission to edit own member profile and is editing own member account',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I set showLocation to false', () => {
				entity.showLocation = false;
			});
			Then('the showLocation property should return false', () => {
				expect(entity.showLocation).toBe(false);
			});
		},
	);

	Scenario(
		'Changing showLocation without permission',
		({ Given, When, Then }) => {
			let setShowLocation: () => void;
			Given(
				'a MemberProfile entity without permission to manage members or edit own member profile',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: false,
						isEditingOwnMemberAccount: false,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I try to set showLocation to false', () => {
				setShowLocation = () => {
					entity.showLocation = false;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setShowLocation).toThrow(PermissionError);
				expect(setShowLocation).toThrow(
					'You do not have permission to update this profile',
				);
			});
		},
	);

	Scenario(
		'Changing showProperties with permission to manage members',
		({ Given, When, Then }) => {
			Given('a MemberProfile entity with permission to manage members', () => {
				visa = makeVisa({ canManageMembers: true });
				entity = new MemberProfile(makeProps(), visa);
			});
			When('I set showProperties to false', () => {
				entity.showProperties = false;
			});
			Then('the showProperties property should return false', () => {
				expect(entity.showProperties).toBe(false);
			});
		},
	);

	Scenario(
		'Changing showProperties with permission to edit own member profile and is editing own member account',
		({ Given, When, Then }) => {
			Given(
				'a MemberProfile entity with permission to edit own member profile and is editing own member account',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: true,
						isEditingOwnMemberAccount: true,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I set showProperties to false', () => {
				entity.showProperties = false;
			});
			Then('the showProperties property should return false', () => {
				expect(entity.showProperties).toBe(false);
			});
		},
	);

	Scenario(
		'Changing showProperties without permission',
		({ Given, When, Then }) => {
			let setShowProperties: () => void;
			Given(
				'a MemberProfile entity without permission to manage members or edit own member profile',
				() => {
					visa = makeVisa({
						canManageMembers: false,
						canEditOwnMemberProfile: false,
						isEditingOwnMemberAccount: false,
					});
					entity = new MemberProfile(makeProps(), visa);
				},
			);
			When('I try to set showProperties to false', () => {
				setShowProperties = () => {
					entity.showProperties = false;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setShowProperties).toThrow(PermissionError);
				expect(setShowProperties).toThrow(
					'You do not have permission to update this profile',
				);
			});
		},
	);
});
