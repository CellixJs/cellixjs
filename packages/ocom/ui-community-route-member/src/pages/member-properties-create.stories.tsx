import { MockedProvider } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { App as AntdApp } from 'antd';
import type React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MemberPropertiesAccessProvider } from '../components/member-properties-access.context.ts';
import { MemberPropertiesCreatePage } from './member-properties-create.tsx';

const communityId = '65f1f77bcf86cd7994390001';
const memberId = '65f1f77bcf86cd7994390002';

const decorator = (Story: React.ComponentType) => (
	<HelmetProvider>
		<AntdApp>
			<MockedProvider>
				<MemoryRouter initialEntries={[`/community/${communityId}/member/${memberId}/properties/create`]}>
					<MemberPropertiesAccessProvider value={{ communityId, memberId, revalidate: async () => undefined }}>
						<Routes>
							<Route
								path="/community/:communityId/member/:memberId/properties/create"
								element={<Story />}
							/>
						</Routes>
					</MemberPropertiesAccessProvider>
				</MemoryRouter>
			</MockedProvider>
		</AntdApp>
	</HelmetProvider>
);

const meta = {
	title: 'Pages/Member/PropertiesCreate',
	component: MemberPropertiesCreatePage,
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MemberPropertiesCreatePage>;

export default meta;
type Story = StoryObj<typeof MemberPropertiesCreatePage>;

export const Default: Story = {
	decorators: [decorator],
};
