import type React from 'react';
import { Outlet } from 'react-router-dom';

/** Neutral shell so member landing remains accessible without Property permission. */
export const MemberSectionLayout: React.FC = () => <Outlet />;
