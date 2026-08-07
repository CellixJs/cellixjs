import { theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';

export const palette = {
	almostBlack: '#1A1A1A',
	dark1: '#44576D',
	dark2: '#29353C',
	mid1: '#AAC7D8',
	mid2: '#768A96',
	light1: '#E6E6E6',
	light2: '#DFEBF6',
	almostWhite: '#F9F6F6',
	white: '#FFFFFF',
	success: '#10A64A',
	successLight: '#DBFFC5',
	successDark: '#107D5A',
	warning: '#FFCC33',
	warningLight: '#FFF0C2',
	warningDark: '#FFB833',
	error: '#CC1F36',
	errorLight: '#FFB9B8',
	errorDark: '#A61129',
	info: '#0074A9',
	infoLight: '#CCE5EE',
	infoDark: '#00528C',
} as const;

export type OwnerCommunityThemeMode = 'light' | 'dark';

export const themeModes: Record<OwnerCommunityThemeMode, OwnerCommunityThemeMode> = {
	light: 'light',
	dark: 'dark',
};

export const lightTheme = {
	primary: palette.dark1,
	primaryHover: 'rgba(41, 53, 60, 0.8)',
	primaryActive: palette.dark2,
	background: palette.almostWhite,
	surface: palette.white,
	surfaceSecondary: palette.light2,
	text: palette.almostBlack,
	textSecondary: palette.dark1,
	link: palette.info,
	linkHover: palette.infoLight,
	border: palette.light1,
	borderStrong: palette.dark2,
	overlay: 'rgba(26, 26, 26, 0.2)',
	disabledText: 'rgba(26, 26, 26, 0.3)',
	disabledButtonBackground: 'rgba(68, 87, 109, 0.3)',
	disabledInputBackground: palette.light1,
	disabledInputBorder: 'rgba(26, 26, 26, 0.3)',
	errorBackground: palette.error,
	errorText: palette.almostWhite,
	errorActive: 'rgba(204, 31, 54, 0.3)',
	errorActiveText: palette.error,
	focus: palette.mid1,
	optionSelected: palette.light2,
	optionActive: `${palette.light2}CC`,
	switchBackground: palette.mid2,
	switchThumb: palette.white,
	switchIcon: palette.dark2,
	stepActiveBackground: palette.mid1,
} as const;

export const darkTheme = {
	primary: palette.mid1,
	primaryHover: 'rgba(223, 235, 246, 0.8)',
	primaryActive: palette.light2,
	background: palette.dark2,
	surface: palette.almostBlack,
	surfaceSecondary: palette.dark1,
	text: palette.almostWhite,
	textSecondary: palette.light1,
	link: palette.infoLight,
	linkHover: palette.info,
	border: palette.mid2,
	borderStrong: palette.light2,
	overlay: 'rgba(249, 246, 246, 0.2)',
	disabledText: 'rgba(249, 246, 246, 0.3)',
	disabledButtonBackground: 'rgba(170, 199, 216, 0.3)',
	disabledInputBackground: palette.dark1,
	disabledInputBorder: 'rgba(249, 246, 246, 0.3)',
	errorBackground: palette.errorLight,
	errorText: palette.error,
	errorActive: 'rgba(204, 31, 54, 0.3)',
	errorActiveText: palette.error,
	focus: palette.mid1,
	optionSelected: palette.dark1,
	optionActive: `${palette.dark1}CC`,
	switchBackground: palette.mid2,
	switchThumb: palette.white,
	switchIcon: palette.dark2,
	stepActiveBackground: palette.dark1,
} as const;

export type OwnerCommunityThemeTokens = {
	primary: string;
	primaryHover: string;
	primaryActive: string;
	background: string;
	surface: string;
	surfaceSecondary: string;
	text: string;
	textSecondary: string;
	link: string;
	linkHover: string;
	border: string;
	borderStrong: string;
	overlay: string;
	disabledText: string;
	disabledButtonBackground: string;
	disabledInputBackground: string;
	disabledInputBorder: string;
	errorBackground: string;
	errorText: string;
	errorActive: string;
	errorActiveText: string;
	focus: string;
	optionSelected: string;
	optionActive: string;
	switchBackground: string;
	switchThumb: string;
	switchIcon: string;
	stepActiveBackground: string;
};

export const getThemeTokens = (mode: OwnerCommunityThemeMode): OwnerCommunityThemeTokens => {
	return mode === 'dark' ? (darkTheme as OwnerCommunityThemeTokens) : (lightTheme as OwnerCommunityThemeTokens);
};

export const getAntDesignTheme = (mode: OwnerCommunityThemeMode): ThemeConfig => {
	const tokens = getThemeTokens(mode);
	const config: ThemeConfig = {
		token: {
			colorPrimary: tokens.primary,
			colorSuccess: palette.success,
			colorWarning: palette.warning,
			colorError: palette.error,
			colorInfo: palette.info,
			borderRadius: 6,
			fontFamily: '"DM Sans", sans-serif',
			fontSize: 16,
			controlHeight: 40,
			lineWidth: 1,
			colorBgBase: tokens.background,
			colorBgContainer: tokens.surface,
			colorBgLayout: tokens.background,
			colorText: tokens.text,
			colorTextSecondary: tokens.textSecondary,
			colorTextDisabled: tokens.disabledText,
			colorBorder: tokens.border,
		},
		components: {
			Button: {
				colorPrimary: tokens.primary,
				colorPrimaryHover: tokens.primaryHover,
				colorPrimaryActive: tokens.primaryActive,
				colorPrimaryTextHover: tokens.surface,
				colorErrorBg: tokens.errorBackground,
				colorErrorBorder: tokens.errorBackground,
				colorErrorText: tokens.errorText,
				colorBgContainerDisabled: tokens.disabledButtonBackground,
				colorTextDisabled: tokens.disabledText,
				borderRadius: 6,
				borderRadiusLG: 8,
				borderRadiusSM: 4,
				fontSizeLG: 16,
				controlOutlineWidth: 2,
			},
			Input: {
				colorTextPlaceholder: tokens.disabledText,
				colorTextLabel: tokens.text,
				colorBorder: tokens.border,
				colorBgContainerDisabled: tokens.disabledInputBackground,
			},
			Select: {
				optionSelectedBg: tokens.optionSelected,
				optionActiveBg: tokens.optionActive,
				colorBgContainer: tokens.surface,
				colorBorder: tokens.border,
			},
			Table: {
				headerBg: tokens.surfaceSecondary,
				rowHoverBg: tokens.optionActive,
				rowSelectedBg: tokens.optionSelected,
				colorBorderSecondary: tokens.border,
			},
			Form: {
				labelColor: tokens.text,
				colorError: palette.error,
			},
			Modal: {
				contentBg: tokens.surface,
				headerBg: tokens.surface,
				borderRadiusLG: 8,
				colorBgElevated: tokens.surface,
			},
			Card: {
				colorBorderSecondary: tokens.border,
				borderRadiusLG: 8,
			},
			Tabs: {
				inkBarColor: tokens.primary,
				itemColor: tokens.textSecondary,
				itemSelectedColor: tokens.primary,
				cardBg: tokens.surface,
			},
			Menu: {
				darkItemBg: tokens.primary,
				itemMarginInline: 16,
				itemBg: tokens.background,
				colorHighlight: tokens.primaryHover,
				colorBgContainer: tokens.surface,
				itemColor: tokens.primary,
				itemSelectedColor: tokens.surface,
				itemActiveBg: tokens.primaryHover,
				darkDangerItemColor: tokens.errorText,
				dangerItemColor: palette.error,
				dangerItemSelectedBg: tokens.errorBackground,
				darkDangerItemSelectedColor: tokens.errorText,
				darkDangerItemSelectedBg: tokens.errorBackground,
				itemSelectedBg: tokens.primaryActive,
				darkItemSelectedBg: tokens.primaryActive,
				darkDangerItemActiveBg: tokens.errorActive,
				dangerItemActiveBg: tokens.errorActive,
				fontSize: 16,
				fontWeightStrong: 700,
				itemHoverColor: tokens.primary,
				dangerItemHoverColor: palette.error,
			},
			Tag: {
				defaultBg: tokens.surfaceSecondary,
				defaultColor: tokens.text,
				borderRadiusSM: 4,
			},
			Badge: {
				colorError: palette.error,
			},
			Tooltip: {
				colorBgSpotlight: tokens.primary,
				colorTextLightSolid: tokens.surface,
			},
			Drawer: {
				colorBgElevated: tokens.surface,
				borderRadiusLG: 8,
			},
			Notification: {
				colorBgElevated: tokens.surface,
				colorText: tokens.text,
			},
			Pagination: {
				itemActiveBg: tokens.primary,
				itemActiveColor: tokens.surface,
			},
			DatePicker: {
				cellActiveWithRangeBg: tokens.optionSelected,
				cellHoverBg: tokens.optionActive,
			},
			Layout: {
				colorBgHeader: tokens.surface,
				colorBgBody: tokens.background,
			},
			Typography: {
				colorLink: tokens.link,
				colorLinkHover: tokens.linkHover,
			},
			Breadcrumb: {
				fontSize: 16,
				iconFontSize: 12,
			},
			Alert: {
				colorErrorBg: palette.errorLight,
				colorErrorBorder: palette.errorDark,
				colorError: palette.error,
				colorIcon: 'inherit',
				colorWarningBg: palette.warningLight,
				colorWarningBorder: palette.warningDark,
				colorWarning: palette.warning,
				colorSuccessBg: palette.successLight,
				colorSuccessBorder: palette.successDark,
				colorSuccess: palette.success,
				colorInfoBg: palette.infoLight,
				colorInfoBorder: palette.infoDark,
				colorInfo: palette.info,
			},
			Checkbox: {
				colorPrimary: tokens.primary,
			},
			Radio: {
				controlHeight: 40,
			},
		},
	};

	if (mode === 'dark') {
		config.algorithm = antdTheme.darkAlgorithm;
	}

	return config;
};
