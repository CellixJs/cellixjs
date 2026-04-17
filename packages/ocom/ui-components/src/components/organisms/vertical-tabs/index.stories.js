import { jsx as _jsx } from "react/jsx-runtime";
import { HomeOutlined, ProfileOutlined, SettingOutlined } from '@ant-design/icons';
import { VerticalTabs } from "./index.js";
const meta = {
    title: 'UI/Organisms/VerticalTabs',
    component: VerticalTabs,
};
export default meta;
export const Default = {
    args: {
        pages: [
            {
                id: '1',
                link: '',
                path: '',
                title: 'Home',
                icon: _jsx(HomeOutlined, {}),
                element: _jsx("div", { children: "Home Content" }),
            },
            {
                id: '2',
                link: 'profile',
                path: 'profile/*',
                title: 'Profile',
                icon: _jsx(ProfileOutlined, {}),
                element: _jsx("div", { children: "Profile Content" }),
            },
            {
                id: '3',
                link: 'settings',
                path: 'settings/*',
                title: 'Settings',
                icon: _jsx(SettingOutlined, {}),
                element: _jsx("div", { children: "Settings Content" }),
            },
        ],
    },
};
//# sourceMappingURL=index.stories.js.map
