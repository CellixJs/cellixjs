import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Col, Menu, Row, theme } from 'antd';
import { useMemo } from 'react';
import { Link, Route, Routes, matchRoutes, useLocation } from 'react-router-dom';
export const VerticalTabs = ({ pages }) => {
    const location = useLocation();
    const convertedRoutes = useMemo(() => {
        return pages.map((page) => ({
            id: page.id,
            path: page.path,
        }));
    }, [pages]);
    const matchedPages = matchRoutes(convertedRoutes, location);
    const matchedIds = matchedPages ? matchedPages.map((match) => match.route.id?.toString() || '') : [];
    // Compute a stable base path for tabs by stripping any of the known tab segments
    // from the current pathname. This avoids building links that nest under the
    // currently active child route (e.g. "/profile/accounts").
    const tabLinks = pages.map((p) => p.link).filter((l) => !!l);
    const getTabBasePath = () => {
        const pathname = location.pathname;
        const indices = tabLinks.map((link) => pathname.indexOf(`/${link}`)).filter((i) => i >= 0);
        if (indices.length === 0) {
            return pathname;
        }
        const firstIndex = Math.min(...indices);
        return pathname.slice(0, firstIndex);
    };
    const tabBasePath = getTabBasePath();
    const toTabHref = (link) => {
        const normalizedBase = tabBasePath.endsWith('/') ? tabBasePath.slice(0, -1) : tabBasePath;
        return link ? `${normalizedBase}/${link}` : normalizedBase;
    };
    const { token: { colorTextBase }, } = theme.useToken();
    return (_jsxs(Row, { wrap: false, style: {
            color: colorTextBase,
        }, children: [_jsx(Col, { flex: "none", children: _jsx(Menu, { mode: "inline", selectedKeys: matchedIds, children: pages.map((page) => (_jsx(Menu.Item, { icon: page.icon, children: _jsx(Link, { to: toTabHref(page.link), children: page.title }) }, page.id))) }) }), _jsx(Col, { flex: "auto", style: { paddingLeft: '24px' }, children: _jsx(Routes, { children: pages.map((page) => (_jsx(Route, { path: page.path, element: page.element }, page.id))) }) })] }));
};
//# sourceMappingURL=index.js.map