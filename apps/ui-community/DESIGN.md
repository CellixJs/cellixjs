---

name: Owner Community Design System

colors:

  palette:
    almost-black: "#1A1A1A"
    dark-1: "#44576D"
    dark-2: "#29353C"
    mid-1: "#AAC7D8"
    mid-2: "#768A96"
    light-1: "#E6E6E6"
    light-2: "#DFEBF6"
    almost-white: "#F9F6F6"
    white: "#FFFFFF"

    success: "#10A64A"
    success-light: "#DBFFC5"
    success-dark: "#107D5A"

    warning: "#FFCC33"
    warning-light: "#FFF0C2"
    warning-dark: "#FFB833"

    error: "#CC1F36"
    error-light: "#FFB9B8"
    error-dark: "#A61129"
    
    info: "#0074A9"
    info-light: "#CCE5EE"
    info-dark: "#00528C"

  themes:

    light:

      primary: "{colors.palette.dark-1}"
      primary-hover: "rgba(41, 53, 60, 0.8)"
      primary-active: "{colors.palette.dark-2}"

      background: "{colors.palette.almost-white}"
      surface: "{colors.palette.white}"
      surface-secondary: "{colors.palette.light-2}"

      text: "{colors.palette.almost-black}"
      text-secondary: "{colors.palette.dark-1}"
      
      link: "{colors.palette.info}"
      link-hover: "{colors.palette.info-light}"

      border: "{colors.palette.light-1}"
      border-strong: "{colors.palette.dark-2}"
      
      overlay: "rgba(26, 26, 26, 0.2)"
      
      disabled-text: "rgba(26, 26, 26, 0.3)"

      disabled-button-background: "rgba(68, 87, 109, 0.3)"
      
      disabled-input-background: "{colors.palette.light-1}"
      disabled-input-border: "rgba(26, 26, 26, 0.3)"
      
      error-background: "{colors.palette.error}"
      error-text: "{colors.palette.almost-white}"
      error-active: "rgba(204, 31, 54, 0.3)"
      error-active-text: "{colors.palette.error}"

      focus: "{colors.palette.mid-1}"

      option-selected: "{colors.palette.light-2}"
      option-active: "{colors.palette.light-2}CC"
      
      switch-background: "{colors.palette.mid-2}"
      switch-thumb: "#FFFFFF"
      switch-icon: "{colors.palette.dark-2}"
      
      step-active-background: "{colors.palette.mid-1}"


    dark:

      primary: "{colors.palette.mid-1}"
      primary-hover: "rgba(223, 235, 246, 0.8)"
      primary-active: "{colors.palette.light-2}"

      background: "{colors.palette.dark-2}"
      surface: "{colors.palette.almost-black}"
      surface-secondary: "{colors.palette.dark-1}"

      text: "{colors.palette.almost-white}"
      text-secondary: "{colors.palette.light-1}"
      
      link: "{colors.palette.info-light}"
      link-hover: "{colors.palette.info}"

      border: "{colors.palette.mid-2}"
      border-strong: "{colors.palette.light-2}"
      
      overlay: "rgba(249, 246, 246, 0.2)"
      
      disabled-text: "rgba(249, 246, 246, 0.3)"

      disabled-button-background: "rgba(170, 199, 216, 0.3)"

      disabled-input-background: "{colors.palette.dark-1}"
      disabled-input-border: "rgba(249, 246, 246, 0.3)"
      
      error-background: "{colors.palette.error-light}"
      error-text: "{colors.palette.error}"
      error-active: "rgba(204, 31, 54, 0.3)"
      error-active-text: "{colors.palette.error}"

      focus: "{colors.palette.mid-1}"

      option-selected: "{colors.palette.dark-1}"
      option-active: "{colors.palette.dark-1}CC"
      
      switch-background: "{colors.palette.mid-2}"
      switch-thumb: "#FFFFFF"
      switch-icon: "{colors.palette.dark-2}"
      
      step-active-background: "{colors.palette.dark-1}"
    

typography:

  h1:
    fontFamily: "Outfit, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0em"

  h2:
    fontFamily: "Outfit, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0em"
    textTransform: uppercase

  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
    
  body-bold:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 900
    lineHeight: 1.5
    letterSpacing: "0em"

  caption:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0em"

rounded:

  none: "0px"
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  pill: "9999px"
  circle: "9999px"

spacing:

  none: "0px"
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "40px"
  3xl: "48px"
  4xl: "64px"
  
layout:

  header:
    height: "100px"
  primaryNavigation:
    width: "18vw"
  content:
    padding: "{spacing.3xl}"
    itemGap: "{spacing.lg}"
    sectionGap: "{spacing.3xl}"
    backButtonGap: "{spacing.3xl}"
    secondaryNavigation:
      width: "15%"
      contentGap: "{spacing.lg}"

components:

  button-primary:
    backgroundColor: "{colors.theme.primary}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    height: "{spacing.2xl}"

  button-primary-hover:
    backgroundColor: "{colors.theme.primary-hover}"

  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.theme.text-secondary}"
    borderColor: "{colors.theme.border-strong}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    height: "{spacing.2xl}"

  button-disabled:
    backgroundColor: "{colors.theme.disabled-button-background}"
    textColor: "{colors.theme.disabled-text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    height: "{spacing.2xl}"
  
  button-danger:
    backgroundColor: "{colors.theme.error-background}"
    textColor: "{colors.theme.error-text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    height: "{spacing.2xl}"

  input:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    borderColor: "{colors.theme.border}"
    rounded: "{rounded.md}"
    padding: "0 {spacing.md}"
    height: "{spacing.2xl}"

  select:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    borderColor: "{colors.theme.border}"
    rounded: "{rounded.md}"
    padding: "0 {spacing.md}"
    height: "{spacing.2xl}"

  input-placeholder:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.disabled-text}"
    typography: "{typography.body}"
    borderColor: "{colors.theme.border}"
    rounded: "{rounded.md}"
    padding: "0 {spacing.md}"
    height: "{spacing.2xl}"

  input-disabled-placeholder:
    backgroundColor: "{colors.theme.disabled-input-background}"
    textColor: "{colors.theme.disabled-text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 {spacing.md}"
    height: "{spacing.2xl}"

  select-option-selected:
    backgroundColor: "{colors.theme.surface-secondary}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"

  select-option-active:
    backgroundColor: "{colors.theme.primary-hover}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"

  textarea:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"

  checkbox:
    textColor: "{colors.theme.primary}"
    typography: "{typography.body}"
    borderColor: "{colors.theme.border-strong}"
    checkedBackgroundColor: "{colors.theme.primary}"
    checkedBorderColor: "{colors.theme.primary}"
    checkedIconColor: "{colors.theme.surface}"
    rounded: "{rounded.sm}"

  radio:
    textColor: "{colors.theme.primary}"
    typography: "{typography.body}"
    borderColor: "{colors.theme.border-strong}"
    checkedBackgroundColor: "{colors.theme.primary}"
    checkedBorderColor: "{colors.theme.primary}"
    checkedIconColor: "{colors.theme.surface}"

  switch:
    backgroundColor: "{colors.theme.switch-background}"
    thumbColor: "{colors.theme.switch-thumb}"
    iconColor: "{colors.theme.switch-icon}"
    rounded: "{rounded.pill}"

  modal:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"

  drawer:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"

  card:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "{spacing.lg}"

  table:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"

  table-header:
    backgroundColor: "{colors.theme.surface-secondary}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"

  table-row-striped:
    backgroundColor: "{colors.theme.option-selected}"

  table-row-sorted:
    backgroundColor: "{colors.theme.background}"

  menu:
    backgroundColor: "{colors.theme.background}"
    textColor: "{colors.theme.primary}"
    typography: "{typography.body}"

  menu-dark:
    backgroundColor: "{colors.theme.primary}"
    textColor: "{colors.theme.surface}"
    typography: "{typography.body}"

  menu-item:
    textColor: "{colors.theme.primary}"
    typography: "{typography.body}"
    padding: "{spacing.lg} {spacing.lg}"

  menu-item-selected:
    backgroundColor: "{colors.theme.primary-active}"
    textColor: "{colors.theme.surface}"

  tabs:
    backgroundColor: "{colors.theme.background}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    padding: "{spacing.sm} {spacing.md}"

  tag:
    backgroundColor: "{colors.theme.surface-secondary}"
    textColor: "{colors.theme.text-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "0 {spacing.xs}"

  badge:
    backgroundColor: "{colors.theme.border-strong}"
    textColor: "{colors.theme.surface}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "0 {spacing.xs}"

  alert:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md} {spacing.lg}"

  alert-error:
    backgroundColor: "{colors.palette.error-light}"
    textColor: "{colors.palette.error}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"

  alert-info:
    backgroundColor: "{colors.palette.info-light}"
    textColor: "{colors.palette.info}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"

  alert-success:
    backgroundColor: "{colors.palette.success-light}"
    textColor: "{colors.palette.success}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"

  alert-warning:
    backgroundColor: "{colors.palette.warning-light}"
    textColor: "{colors.palette.warning}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"

  alert-success-dark:
    backgroundColor: "{colors.palette.success-dark}"
    textColor: "{colors.palette.almost-white}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"

  alert-warning-dark:
    backgroundColor: "{colors.palette.warning-dark}"
    textColor: "{colors.palette.almost-white}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"

  alert-error-dark:
    backgroundColor: "{colors.palette.error-dark}"
    textColor: "{colors.palette.almost-white}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"

  alert-info-dark:
    backgroundColor: "{colors.palette.info-dark}"
    textColor: "{colors.palette.almost-white}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"

  tooltip:
    backgroundColor: "{colors.theme.primary}"
    textColor: "{colors.theme.surface}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"

  popover:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"

  dropdown:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"

  pagination:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"

  breadcrumb:
    backgroundColor: "transparent"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"

  menu-danger-selected:
    backgroundColor: "{colors.theme.error-background}"
    textColor: "{colors.theme.error-text}"
    typography: "{typography.body}"

  menu-danger-active:
    backgroundColor: "{colors.theme.error-active}"
    textColor: "{colors.theme.error-active-text}"
    typography: "{typography.body}"

  border-swatch:
    backgroundColor: "{colors.theme.border}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"

  overlay-swatch:
    backgroundColor: "{colors.theme.overlay}"
    textColor: "{colors.theme.surface}"
    typography: "{typography.body}"

  form:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"

  datepicker:
    backgroundColor: "{colors.theme.surface}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"

  divider:
    backgroundColor: "{colors.theme.border}"
    textColor: "{colors.theme.text}"
    typography: "{typography.body}"

  result-title:
    backgroundColor: "transparent"
    textColor: "{colors.theme.text}"
    typography: "{typography.body-bold}"

  link:
    backgroundColor: "transparent"
    textColor: "{colors.theme.link}"
    typography: "{typography.body}"

  link-hover:
    backgroundColor: "transparent"
    textColor: "{colors.theme.link-hover}"
  
  steps-completed:
    backgroundColor: "transparent"
    iconColor: "{colors.theme.border-strong}"
    outlineColor: "{colors.theme.border-strong}"
    labelColor: "{colors.theme.text}"

  steps-wait:
    backgroundColor: "{colors.theme.switch-background}"
    outlineColor: "{colors.theme.switch-background}"
    labelColor: "{colors.theme.switch-background}"

  steps-process:
    backgroundColor: "{colors.theme.step-active-background}"
    numberColor: "{colors.theme.border-strong}"
    loadingBorderColor: "{colors.theme.border-strong}"
    loadingTrackColor: "{colors.theme.switch-background}"
    labelColor: "{colors.theme.text}"

extensions:

  antDesign:

    seedTokens:

      colorPrimary: "{colors.theme.primary}"
      colorSuccess: "{colors.palette.success}"
      colorWarning: "{colors.palette.warning}"
      colorError: "{colors.palette.error}"
      colorInfo: "{colors.palette.info}"

      borderRadius: "{rounded.md}"

      fontFamily: "DM Sans, sans-serif"

      fontSize: "16px"

      controlHeight: "{spacing.2xl}"

      lineWidth: "1px"

      motion: "0.2s ease"

      colorBgBase: "{colors.theme.background}"
      colorBgContainer: "{colors.theme.surface}"
      colorBgLayout: "{colors.theme.background}"
      colorText: "{colors.theme.text}"
      colorTextSecondary: "{colors.theme.text-secondary}"
      colorTextDisabled: "{colors.theme.disabled-text}"
      colorBorder: "{colors.theme.border}"

    aliasTokens:

      colorBgContainer: "{colors.theme.surface}"
      colorBgLayout: "{colors.theme.background}"
      colorBgElevated: "{colors.theme.surface}"
      colorText: "{colors.theme.text}"
      colorTextSecondary: "{colors.theme.text-secondary}"
      colorTextDisabled: "{colors.theme.disabled-text}"
      colorBorder: "{colors.theme.border}"
      colorBorderSecondary: "{colors.theme.border-strong}"
      colorFillAlter: "{colors.theme.surface-secondary}"
      colorFillTertiary: "{colors.theme.option-selected}"
      colorPrimaryBg: "{colors.theme.primary-hover}"
      colorPrimaryBorder: "{colors.theme.primary}"
      colorSuccessBg: "{colors.palette.success-light}"
      colorWarningBg: "{colors.palette.warning-light}"
      colorErrorBg: "{colors.theme.error-background}"
      colorInfoBg: "{colors.palette.info-light}"

    componentTokens:

      Button:
        colorPrimary: "{colors.theme.primary}"
        colorPrimaryHover: "{colors.theme.primary-hover}"
        colorPrimaryActive: "{colors.theme.primary-active}"
        colorPrimaryTextHover: "{colors.theme.surface}"
        
        colorErrorBg: "{colors.theme.error-background}"
        colorErrorBorder: "{colors.theme.error-background}"
        colorErrorText: "{colors.theme.error-text}"
        
        colorBgContainerDisabled: "{colors.theme.disabled-button-background}"
        colorTextDisabled: "{colors.theme.disabled-text}"
        
        borderRadius: "{rounded.md}"
        borderRadiusLG: "{rounded.lg}"
        borderRadiusSM: "{rounded.sm}"
        
        fontSizeLG: "16px"
        controlOutlineWidth: "2px"

      Input:
        colorTextPlaceholder: "{colors.theme.disabled-text}"
        colorTextLabel: "{colors.theme.text}"
        
        colorBorder: "{colors.theme.border}"
        colorBgContainerDisabled: "{colors.theme.disabled-input-background}"

      Select:
        optionSelectedBg: "{colors.theme.option-selected}"
        optionActiveBg: "{colors.theme.option-active}"
        colorBgContainer: "{colors.theme.surface}"
        colorBorder: "{colors.theme.border}"

      Table:
        headerBg: "{colors.theme.surface-secondary}"
        rowHoverBg: "{colors.theme.option-active}"
        rowSelectedBg: "{colors.theme.option-selected}"
        colorBorderSecondary: "{colors.theme.border}"

      Form:
        labelColor: "{colors.theme.text}"
        colorError: "{colors.palette.error}"

      Modal:
        contentBg: "{colors.theme.surface}"
        headerBg: "{colors.theme.surface}"
        borderRadiusLG: "{rounded.lg}"
        colorBgElevated: "{colors.theme.surface}"

      Card:
        colorBorderSecondary: "{colors.theme.border}"
        borderRadiusLG: "{rounded.lg}"

      Tabs:
        inkBarColor: "{colors.theme.primary}"
        itemColor: "{colors.theme.text-secondary}"
        itemSelectedColor: "{colors.theme.primary}"
        cardBg: "{colors.theme.surface}"

      Menu:
        darkItemBg: "{colors.theme.primary}"
        itemMarginInline: "{spacing.md}"
        itemBg: "{colors.theme.background}"
        colorHighlight: "{colors.theme.primary-hover}"
        colorBgContainer: "{colors.theme.surface}"
        itemColor: "{colors.theme.primary}"
        itemSelectedColor: "{colors.theme.surface}"
        itemActiveBg: "{colors.theme.primary-hover}"
        darkDangerItemColor: "{colors.theme.error-text}"
        dangerItemColor: "{colors.palette.error}"
        dangerItemSelectedBg: "{colors.theme.error-background}"
        darkDangerItemSelectedColor: "{colors.theme.error-text}"
        darkDangerItemSelectedBg: "{colors.theme.error-background}"
        itemSelectedBg: "{colors.theme.primary-active}"
        darkItemSelectedBg: "{colors.theme.primary-active}"
        darkDangerItemActiveBg: "{colors.theme.error-active}"
        dangerItemActiveBg: "{colors.theme.error-active}"
        fontSize: "16px"
        fontWeightStrong: 700
        itemHoverColor: "{colors.theme.primary}"
        dangerItemHoverColor: "{colors.palette.error}"

      Tag:
        defaultBg: "{colors.theme.surface-secondary}"
        defaultColor: "{colors.theme.text}"
        borderRadiusSM: "{rounded.sm}"

      Badge:
        colorError: "{colors.palette.error}"
        textColor: "{colors.theme.surface}"

      Tooltip:
        colorBgSpotlight: "{colors.theme.primary}"
        colorTextLightSolid: "{colors.theme.surface}"

      Drawer:
        colorBgElevated: "{colors.theme.surface}"
        borderRadiusLG: "{rounded.lg}"

      Notification:
        colorBgElevated: "{colors.theme.surface}"
        colorText: "{colors.theme.text}"

      Pagination:
        itemActiveBg: "{colors.theme.primary}"
        itemActiveColor: "{colors.theme.surface}"

      DatePicker:
        cellActiveWithRangeBg: "{colors.theme.option-selected}"
        cellHoverBg: "{colors.theme.option-active}"

      Layout:
        colorBgHeader: "{colors.theme.surface}"
        colorBgBody: "{colors.theme.background}"

      Typography:
        colorLink: "{colors.theme.link}"
        colorLinkHover: "{colors.theme.link-hover}"

      Breadcrumb:
        fontSize: "16px"
        iconFontSize: "12px"

      Alert:
        colorErrorBg: "{colors.palette.error-light}"
        colorErrorBorder: "{colors.palette.error-dark}"
        colorError: "{colors.palette.error}"
        colorIcon: "inherit"
        colorWarningBg: "{colors.palette.warning-light}"
        colorWarningBorder: "{colors.palette.warning-dark}"
        colorWarning: "{colors.palette.warning}"
        colorSuccessBg: "{colors.palette.success-light}"
        colorSuccessBorder: "{colors.palette.success-dark}"
        colorSuccess: "{colors.palette.success}"
        colorInfoBg: "{colors.palette.info-light}"
        colorInfoBorder: "{colors.palette.info-dark}"
        colorInfo: "{colors.palette.info}"

      Checkbox:
        colorPrimary: "{colors.theme.primary}"

      Radio:
        controlHeight: "{spacing.2xl}"

audit:

  allowInlineStyles: false

  allowImportant: false

  allowHardcodedColors: false

  allowHardcodedSpacing: false

  allowHardcodedTypography: false

  allowHardcodedRadius: false

  allowHardcodedShadow: false

  allowMagicNumbers: false

  report:

    unusedVariables: true

    duplicateVariables: true

    orphanedTokens: true

    inconsistentSpacing: true

    inconsistentTypography: true

    inconsistentBorderRadius: true

    inconsistentShadows: true

    duplicateColors: true

    overriddenAntTokens: true

    arbitraryCssValues: true

    excessiveSpecificity: true

    duplicateCss: true

    deadCss: true

    missingFocusStates: true

    inconsistentComponents: true
---

# Owner Community CXA Design Guidelines

**Theme:** Light & Dark

This file is the canonical source of truth for the Owner Community visual language. The front matter defines the machine-readable tokens, while the markdown body acts as the human reference for how those tokens should appear in the live product. Any visual value that does not resolve back to the tokens below should be treated as a deviation and reported.

## Tokens - Colors

| Name                      | Value                    | Token                              | Role                                                                         |
| ------------------------- | ------------------------ | ---------------------------------- | ---------------------------------------------------------------------------- |
| Almost Black               | `#1A1A1A`                | `colors.palette.almost-black`                   | Highest-contrast neutral. Primary text in light theme and elevated surfaces in dark theme. |
| Dark 1                   | `#44576D`                | `colors.palette.dark-1`                 | Primary brand neutral. Used for primary actions, secondary text, and dark theme secondary surfaces.                    |
| Dark 2                 | `#29353C`                | `colors.palette.dark-2`                 | Deep neutral used for active states, strong borders, and dark theme backgrounds.            |
| Mid 1              | `#AAC7D8`                | `colors.palette.mid-1`              | Accent neutral for focus indicators, dark theme primary actions, and highlights.                                |
| Mid 2               | `#768A96`                | `colors.palette.mid-2`               | Mid-tone neutral used for borders, disabled controls, and switch backgrounds.                                  |
| Light 1               | `#E6E6E6`                | `colors.palette.light-1`               | Light neutral for borders, disabled surfaces, and supporting UI elements.                                        |
| Light 2              | `#DFEBF6`                | `colors.palette.light-2`              | Secondary surface color, selected states, and light accents across both themes.                               |
| Almost White              | `#F9F6F6`                | `colors.palette.almost-white`              | Primary light background and high-contrast text in dark theme.                                   |
| White                    | `#FFFFFF`                | `colors.palette.white`                    | Pure surface color for elevated containers and controls requiring maximum contrast                          |
| Success                | `#10A64A`                | `colors.palette.success`                | Primary success color for positive feedback, icons, and indicators.                                    |
| Success Light                | `#DBFFC5`                | `colors.palette.success-light`                | Background for success alerts, badges, and status messaging.                          |
| Success Dark                      | `#107D5A`                | `colors.palette.success-dark`                      | Strong success emphasis for high-contrast success components.                       |
| Warning                     | `#FFCC33`                | `colors.palette.warning`                     | Primary warning color for cautionary messaging and icons.                                      |
| Warning Light                | `#FFF0C2`                | `colors.palette.warning-light`                | Background for warning alerts and highlighted warning states.                                   |
| Warning Dark               | `#FFB833`                | `colors.palette.warning-dark`               | High-emphasis warning color for dark or elevated warning components.                                  |
| Error                    | `#CC1F36`                | `colors.palette.error`                    | Primary destructive color for errors, validation, and destructive actions.                                 |
| Error Light             | `#FFB9B8`                | `colors.palette.error-light`                    | Background for error alerts and validation messages.                        |
| Error Dark                | `#A61129`                | `colors.palette.error-dark`                | High-emphasis error color for destructive UI and dark variants.                                           |
| Info                | `#0074A9`                | `colors.palette.info`                | Primary informational color for links, informational states, and accents.                               |
| Info Light                       | `#CCE5EE`                | `colors.palette.info-light`                       | Background for informational alerts and subtle information states.                                    |
| Info Dark                   | `#00528C`                | `colors.palette.info-dark`                   | High-emphasis informational color for dark variants and strong accents.                                                          |

## Tokens - Themes

| Token | Light Theme | Dark Theme | Role |
|-------|-------------|------------|------|
| `primary` | `dark-1` | `mid-1` | Primary color used for buttons, links, active controls, and key interactive elements. |
| `primary-hover` | `rgba(41,53,60,0.8)` | `rgba(223,235,246,0.8)` | Hover state for primary interactive elements. |
| `primary-active` | `dark-2` | `light-2` | Active or pressed state for primary controls. |
| `background` | `almost-white` | `dark-2` | Main application background. |
| `surface` | `white` | `almost-black` | Primary surface for cards, forms, drawers, modals, and containers. |
| `surface-secondary` | `light-2` | `dark-1` | Secondary surfaces including grouped content, table headers, and selected regions. |
| `text` | `almost-black` | `almost-white` | Primary text color. |
| `text-secondary` | `dark-1` | `light-1` | Secondary text, descriptions, labels, and supporting content. |
| `link` | `info` | `info-light` | Default hyperlink color. |
| `link-hover` | `info-light` | `info` | Hover state for hyperlinks. |
| `border` | `light-1` | `mid-2` | Default borders, dividers, and separators. |
| `border-strong` | `dark-2` | `light-2` | High-emphasis borders, outlines, and selected states. |
| `overlay` | `rgba(26,26,26,0.2)` | `rgba(249,246,246,0.2)` | Overlay displayed behind dialogs, drawers, modals, and popovers. |
| `disabled-text` | `rgba(26,26,26,0.3)` | `rgba(249,246,246,0.3)` | Disabled text, icons, and supporting UI. |
| `disabled-button-background` | `rgba(68,87,109,0.3)` | `rgba(170,199,216,0.3)` | Background for disabled buttons and interactive controls. |
| `disabled-input-background` | `light-1` | `dark-1` | Background for disabled inputs and form controls. |
| `disabled-input-border` | `rgba(26,26,26,0.3)` | `rgba(249,246,246,0.3)` | Border for disabled form controls. |
| `error-background` | `error` | `error-light` | Background for destructive actions and error surfaces. |
| `error-text` | `almost-white` | `error` | Text displayed on error backgrounds. |
| `error-active` | `rgba(204,31,54,0.3)` | `rgba(204,31,54,0.3)` | Active or selected state for destructive controls. |
| `error-active-text` | `error` | `error` | Text or icon color used in active error states. |
| `focus` | `mid-1` | `mid-1` | Keyboard focus indicator and accessibility outline. |
| `option-selected` | `light-2` | `dark-1` | Background for selected menu, dropdown, table, and list options. |
| `option-active` | `light-2` + `CC` | `dark-1` + `CC` | Hover or active background for selectable options. |
| `switch-background` | `mid-2` | `mid-2` | Background track of switch components. |
| `switch-thumb` | `white` | `white` | Thumb color of switch controls. |
| `switch-icon` | `dark-2` | `dark-2` | Icon displayed within switch controls. |

## Tokens - Typography

### H1
- **Font family:** Outfit, sans-serif
- **Size:** 32px
- **Weight:** 700
- **Line height:** 1.2
- **Letter spacing:** 0em
- **Role:** Primary page headings and major section titles.

### H2
- **Font family:** Outfit, sans-serif
- **Size:** 24px
- **Weight:** 700
- **Line height:** 1.25
- **Letter spacing:** 0em
- **Text transform:** uppercase
- **Role:** Section headings and secondary page titles.

### Body
- **Font family:** DM Sans, sans-serif
- **Size:** 16px
- **Weight:** 400
- **Line height:** 1.5
- **Letter spacing:** 0em
- **Role:** Default text style used for paragraphs, form fields, menus, tables, and most components.

### Body Bold
- **Font family:** DM Sans, sans-serif
- **Size:** 16px
- **Weight:** 900
- **Line height:** 1.5
- **Letter spacing:** 0em
- **Role:** Emphasized body text, result titles, key values, and important labels.

### Caption
- **Font family:** DM Sans, sans-serif
- **Size:** 12px
- **Weight:** 400
- **Line height:** 1.2
- **Letter spacing:** 0em
- **Role:** Helper text, captions, metadata, badges, tooltips, and other supporting information

## Layout

The layout model is built around a fixed 100px header and an 18vw primary navigation rail, with content areas governed by the spacing scale rather than arbitrary values. Content padding uses the 3xl token (48px), and both section gaps and the gap before back buttons also resolve to 3xl (48px), giving the page a consistent, generous rhythm at the macro level. Within content, individual items sit at the lg gap (24px). Where a secondary navigation panel is present, it takes 15% of the available width and uses its own contentGap at the lg token (24px) to separate nav items from adjacent content. Menus, tables, alerts, and forms are the recurring building blocks; they should all look like parts of the same system even when rendered in different contexts.

## Tokens - Spacing & Shapes

**Base unit:** 4px

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| none | 0px | `spacing.none` |
| xxs | 4px | `spacing.xxs` |
| xs | 8px | `spacing.xs` |
| sm | 12px | `spacing.sm` |
| md | 16px | `spacing.md` |
| lg | 24px | `spacing.lg` |
| xl | 32px | `spacing.xl` |
| 2xl | 40px | `spacing.2xl` |
| 3xl | 48px | `spacing.3xl` |
| 4xl | 64px | `spacing.4xl` |

### Border Radius

| Element | Value |
|---------|-------|
| none | 0px |
| xs | 2px |
| sm | 4px |
| md | 6px |
| lg | 8px |
| xl | 12px |
| pill | 9999px |
| circle | 9999px |

### Layout

- **Page max-width:** 1200px
- **Section gap:** `spacing.3xl` (48px)
- **Card padding:** `spacing.md` (16px)
- **Element gap:** `spacing.xs` (8px)

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Background | `colors.theme.background` | Default page background |
| 1 | Surface | `colors.theme.surface` | Card, modal, and control surface |
| 2 | Surface Secondary | `colors.theme.surface-secondary` | Table header wash and highlights |

## Elevation

**Overlay Treatment:** used behind modals, drawers, and popovers
- **Light mode:** rgba(26,26,26,0.2)
- **Dark mode:** rgba(249,246,246,0.2)

## Components

### Primary Button
**Role:** Primary action, save, submit, or confirm

Background `colors.theme.primary`
Text `colors.theme.text`
Border Radius `rounded.md`
Padding `spacing.sm spacing.md`
Height `spacing.2xl`
Typography `typography.body`

This is the dominant call-to-action surface. Hover and active states are handled by separate tokens below.

This is the dominant call-to-action surface and should be used consistently.

### Primary Button - Hover
**Role:** Hover state for the primary button

Background `colors.theme.primary-hover`

Resolves to a semi-transparent variant of the primary color (rgba(41,53,60,0.8) in light, rgba(223,235,246,0.8) in dark) rather than a distinct hue.

### Secondary Button
**Role:** Secondary action paired with the primary button

Background `transparent`
Text `colors.primary.text-secondary`
Border Radius `rounded.md`
Padding `padding.sm padding.md`
Height `spacing.2xl`
Typography `typography.body`

It pairs with the primary button without introducing new fills.

### Disabled Button
**Role:** Disabled action state

Background `colors.theme.disabled-button-background`
Text `colors.theme.disabled-text`
Border Radius `rounded.md`
Padding `padding.sm padding.md`
Height `spacing.2xl`
Typography `typography.body`

Uses the dedicated disabled tokens.

### Danger Button
**Role:** Destructive primary action

Background: `colors.theme.error-background`
Text `colors.theme.error-text`
Border Radius `rounded.md`
Padding `padding.sm padding.md`
Height `spacing.2xl`
Typography `typography.body`

### Inputs and Selects
**Role:** Form entry controls

Background `colors.theme.surface`
Text `colors.theme.text`
Border `colors.theme.border`
Border Radius `rounded.md`
Padding `padding.sm padding.md`
Height `spacing.2xl`
Typography `typography.body`

Input and select fields should stay visually aligned and should not drift into custom padding or border treatments.

### Input Placeholder States
**Role:** Empty and disabled field text

**Placeholder**
Background `colors.theme.surface`
Text `colors.theme.disabled-text`
Border `colors.theme.border`
Border Radius `rounded.md`
Padding `0 spacing.md`
Height `spacing.2xl`
Typography `typography.body`

**Disabled**
Background `colors.theme.disabled-input-background`
Text `colors.theme.disabled-text`
Border Radius `rounded.md`
Padding `0 spacing.md`
Height `spacing.2xl`
Typography `typography.body`

### Select Option States
**Role:**

**Selected**
Background `colors.theme.surface-secondary`
Text `colors.theme.text`
Border Radius `rounded.sm`
Typography `typography.body`

**Active/Hover**
Background `colors.theme.primary-hover`
Text `colors.theme.text`
Border Radius `rounded.sm`
Typography `typography.body`

### Textarea
**Role:** Multi-line form entry

Background `colors.theme.surface`
Text `colors.theme.text`
Border Radius `rounded.md`
Padding `spacing.sm spacing.md`
Typography `typography.body`
Padded with the spacing scale
This control should feel like a larger sibling of the input.

### Checkbox and Radio
**Role:** Binary and exclusive selection controls

Text `colors.theme.primary`
Border `colors.theme.border-strong`
Checked Background `colors.theme.primary`
Checked Border `colors.theme.primary`
Checked Icon `colors.theme.surface`
Typography `typography.body`
Border Radius (checkbox only) `rounded.sm`

Radio shares all checkbox tokens but has no independent radius value defined (circular by convention, not tokenized).

### Switch
**Role:** Boolean toggle

Background `colors.theme.switch-background`
Thumb `colors.theme.switch-thumb`
Icon `colors.theme.switch-icon`
Border Radius `rounded.pill`

Switch track/thumb/icon colors are identical across light and dark themes (mid-2, white, dark-2). This is intentional, not a missing dark-mode override.

### Modal and Drawer
**Role:** Elevated overlays for focused tasks

Background `colors.theme.surface`
Text `colors.theme.text`
Border `Radius rounded.md`
Padding `spacing.lg`
Typography `typography.body`

### Card
**Role:** Base content container

Background `colors.theme.surface`
Text `colors.theme.text`
Border Radius `rounded.sm`
Padding `spacing.lg`
Typography `typography.body`

They should feel quiet, structured, and reusable.

### Table
**Role:** Data presentation

Background `colors.theme.surface`
Text `colors.theme.text`
Typography `typography.body`

**Header:** Background `colors.theme.surface-secondary`, Text `colors.theme.text`, Typography `typography.body`

**Striped rows:** Background `colors.theme.background`

**Sorted cells:** Background `colors.theme.option-selected`

### Menu
**Role:** Navigation and grouped options

**Light menu:** Background `colors.theme.background`, Text `colors.theme.primary`

**Dark menu:** Background `colors.theme.primary`, Text `colors.theme.surface`

**Menu item:** Text `colors.theme.primary`, Padding `spacing.lg spacing.lg`

**Menu item selected:** Background `colors.theme.primary-active`, Text `colors.theme.surface`

**Menu item danger, selected:** Background `colors.theme.error-background`, Text `colors.theme.error-text`

**Menu item danger, active:** Background `colors.theme.error-active`, Text `colors.theme.error-active-text`

Typography is typography.body throughout.

### Tabs
**Role:** Section switching and inline navigation

Background `colors.theme.background`
Text `colors.theme.text`
Padding `spacing.sm spacing.md`
Typography `typography.body`

### Tag and Badge
**Role:** Compact status, label, and count surfaces

**Tag:** Background `colors.theme.surface-secondary`, Text `colors.theme.text-secondary`, Border Radius `rounded.pill`, Padding `0 spacing.xs`, Typography `typography.caption`

**Badge:** Background `colors.theme.border-strong`, Text `colors.theme.surface`, Border Radius `rounded.pill`, Padding `0 spacing.xs`, Typography `typography.caption`

### Alert
**Role:** Status messaging

**Base:** Background `colors.theme.surface`, Text `colors.theme.text`, Border Radius `rounded.sm`, Padding `spacing.md spacing.lg`

**Status variants (light backgrounds):**

**Error:** Background `colors.palette.error-light`, Text `colors.palette.error`
**Warning:** Background `colors.palette.warning-light`, Text `colors.palette.warning`
**Success:** Background `colors.palette.success-light`, Text `colors.palette.success`
**Info:** Background `colors.palette.info-light`, Text `colors.palette.info`

**High-emphasis / dark variants:**

**Success dark:** Background `colors.palette.success-dark`, Text `colors.palette.almost-white`
**Warning dark:** — Background `colors.palette.warning-dark`, Text `colors.palette.almost-white`
**Error dark:** Background `colors.palette.error-dark`, Text `colors.palette.almost-white`
**Info dark:** Background `colors.palette.info-dark`, Text `colors.palette.almost-white`

All variants use typography.body and rounded.sm. Note the alert variants pull from colors.palette directly rather than colors.theme — these are not theme-dependent, unlike most other components.

### Tooltip and Popover
**Role:** Supplemental context surfaces

**Tooltip:** Background `colors.theme.primary`, Text `colors.theme.surface`, Border Radius `rounded.sm`, Typography `typography.caption`
**Popover:** Background `colors.theme.surface`, Text `colors.theme.text`, Border Radius `rounded.sm`, Typography `typography.body`

### Pagination and Breadcrumb
**Role:** Navigation affordances

**Pagination:** Background `colors.theme.surface`, Text `colors.theme.text`, Typography `typography.body`
**Breadcrumb:** Background transparent, Text `colors.theme.text`, Typography `typography.body`

### Date Picker and Dropdown
**Role:** Selection and overlay controls

Background `colors.theme.surface`
Text `colors.theme.text`
Border Radius `rounded.sm`
Typography `typography.body`

Selection states within date picker use the same option-selected/option-active tints as select (`colors.theme.option-selected`, `colors.theme.option-active`).

### Divider and Result Title
**Role:** Structural separation and prominent empty states 

**Divider:** Background `colors.theme.border`, Text `colors.theme.text`, Typography `typography.body`
**Result title:** Background `transparent`, Text `colors.theme.text`, Typography `typography.body-bold`

### Links
**Role:** Inline and standalone hyperlinks

Default Text `colors.theme.link`
Hover Text `colors.theme.link-hover`
Background `transparent`
Typography `typography.body`

### Steps
**Role:** Multi-step progress

**Completed**
Background `transparent`
Icon `colors.theme.border-strong`
Outline `colors.theme.border-strong`
Label `colors.theme.text`

**In Progress**
Background `colors.theme.step-active-background`
Number/icon `colors.theme.border-strong`
Loading ring border `colors.theme.border-strong`
Loading ring track `colors.theme.switch-background`
Label `colors.theme.text`

**Waiting**
Background `colors.theme.switch-background`
Outline `colors.theme.switch-background`
Label `colors.theme.switch-background`

###

## Do's and Don'ts

### Do
- Use the token map for every visual decision.
- Treat Ant Design component overrides as violations unless they are encoded in the component token mappings.
- Use the approved spacing and radius scales instead of arbitrary values.
- Keep table headers, alert states, and menu selections aligned with the declared tokens.
- Report deviations when the live site introduces one-off styling not present in the file.

### Don't
- Don't add new hardcoded colors, spacing values, or radii.
- Don't use inline styles or `!important` for cosmetic fixes.
- Don't drift into duplicate or near-duplicate colors when a token already exists.
- Don't let controls or content surfaces visually diverge from their tokenized siblings.

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Palette */
  --color-almost-black: #1a1a1a;
  --color-dark-1: #44576d;
  --color-dark-2: #29353c;
  --color-mid-1: #aac7d8;
  --color-mid-2: #768a96;
  --color-light-1: #e6e6e6;
  --color-light-2: #dfebf6;
  --color-almost-white: #f9f6f6;
  --color-white: #ffffff;

  --color-success: #10a64a;
  --color-success-light: #dbffc5;
  --color-success-dark: #107d5a;

  --color-warning: #ffcc33;
  --color-warning-light: #fff0c2;
  --color-warning-dark: #ffb833;

  --color-error: #cc1f36;
  --color-error-light: #ffb9b8;
  --color-error-dark: #a61129;

  --color-info: #0074a9;
  --color-info-light: #cce5ee;
  --color-info-dark: #00528c;

  /* Typography */
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'DM Sans', sans-serif;

  --text-h1-size: 32px;
  --text-h1-weight: 700;
  --text-h1-line-height: 1.2;

  --text-h2-size: 24px;
  --text-h2-weight: 700;
  --text-h2-line-height: 1.25;

  --text-body-size: 16px;
  --text-body-weight: 400;
  --text-body-line-height: 1.5;

  --text-body-bold-weight: 900;

  --text-caption-size: 12px;
  --text-caption-weight: 400;
  --text-caption-line-height: 1.33;

  /* Border Radius */
  --radius-none: 0px;
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-pill: 9999px;
  --radius-circle: 9999px;

  /* Spacing */
  --space-none: 0px;
  --space-xxs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 40px;
  --space-3xl: 48px;
  --space-4xl: 64px;

  /* Light theme (default) */
  --color-primary: var(--color-dark-1);
  --color-primary-hover: rgba(41, 53, 60, 0.8);
  --color-primary-active: var(--color-dark-2);

  --color-background: var(--color-almost-white);
  --color-surface: var(--color-white);
  --color-surface-secondary: var(--color-light-2);

  --color-text: var(--color-almost-black);
  --color-text-secondary: var(--color-dark-1);

  --color-link: var(--color-info);
  --color-link-hover: var(--color-info-light);

  --color-border: var(--color-light-1);
  --color-border-strong: var(--color-dark-2);

  --color-overlay: rgba(26, 26, 26, 0.2);

  --color-disabled-text: rgba(26, 26, 26, 0.3);
  --color-disabled-button-background: rgba(68, 87, 109, 0.3);
  --color-disabled-input-background: var(--color-light-1);
  --color-disabled-input-border: rgba(26, 26, 26, 0.3);

  --color-error-background: var(--color-error);
  --color-error-text: var(--color-almost-white);
  --color-error-active: rgba(204, 31, 54, 0.3);
  --color-error-active-text: var(--color-error);

  --color-focus: var(--color-mid-1);

  --color-option-selected: var(--color-light-2);
  --color-option-active: color-mix(in srgb, var(--color-light-2) 80%, transparent);

  --color-switch-background: var(--color-mid-2);
  --color-switch-thumb: #ffffff;
  --color-switch-icon: var(--color-dark-2);

  --color-step-active-background: var(--color-mid-1);
}

/*Dark theme*/
[data-theme="dark"] {
  --color-primary: var(--color-mid-1);
  --color-primary-hover: rgba(223, 235, 246, 0.8);
  --color-primary-active: var(--color-light-2);

  --color-background: var(--color-dark-2);
  --color-surface: var(--color-almost-black);
  --color-surface-secondary: var(--color-dark-1);

  --color-text: var(--color-almost-white);
  --color-text-secondary: var(--color-light-1);

  --color-link: var(--color-info-light);
  --color-link-hover: var(--color-info);

  --color-border: var(--color-mid-2);
  --color-border-strong: var(--color-light-2);

  --color-overlay: rgba(249, 246, 246, 0.2);

  --color-disabled-text: rgba(249, 246, 246, 0.3);
  --color-disabled-button-background: rgba(170, 199, 216, 0.3);
  --color-disabled-input-background: var(--color-dark-1);
  --color-disabled-input-border: rgba(249, 246, 246, 0.3);

  --color-error-background: var(--color-error-light);
  --color-error-text: var(--color-error);
  --color-error-active: rgba(204, 31, 54, 0.3);
  --color-error-active-text: var(--color-error);

  --color-focus: var(--color-mid-1);

  --color-option-selected: var(--color-dark-1);
  --color-option-active: color-mix(in srgb, var(--color-dark-1) 80%, transparent);

  --color-switch-background: var(--color-mid-2);
  --color-switch-thumb: #ffffff;
  --color-switch-icon: var(--color-dark-2);

  --color-step-active-background: var(--color-dark-1);
}
```

### Ant Design Theme Mapping

```ts
export const lightTheme = {
  token: {
    colorPrimary: '#44576D',        // theme.primary (light)
    colorSuccess: '#10A64A',        // palette.success
    colorWarning: '#FFCC33',        // palette.warning
    colorError: '#CC1F36',          // palette.error
    colorInfo: '#0074A9',           // palette.info

    colorBgBase: '#F9F6F6',         // theme.background
    colorBgLayout: '#F9F6F6',       // theme.background
    colorBgContainer: '#FFFFFF',    // theme.surface

    colorText: '#1A1A1A',           // theme.text
    colorTextSecondary: '#44576D',  // theme.text-secondary
    colorTextDisabled: 'rgba(26, 26, 26, 0.3)', // theme.disabled-text
    colorBorder: '#E6E6E6',         // theme.border

    fontFamily: 'DM Sans, sans-serif',
    fontSize: 16,
    borderRadius: 6,                // rounded.md
    controlHeight: 40,               // spacing.2xl
    lineWidth: 1,
  },
  components: {
    Button: {
      colorPrimary: '#44576D',                    // theme.primary
      colorPrimaryHover: 'rgba(41, 53, 60, 0.8)', // theme.primary-hover
      colorPrimaryActive: '#29353C',              // theme.primary-active
      colorPrimaryTextHover: '#FFFFFF',           // theme.surface
      colorErrorBg: '#CC1F36',                    // theme.error-background
      colorErrorBorder: '#CC1F36',                // theme.error-background
      colorErrorText: '#F9F6F6',                  // theme.error-text
      colorBgContainerDisabled: 'rgba(68, 87, 109, 0.3)', // theme.disabled-button-background
      colorTextDisabled: 'rgba(26, 26, 26, 0.3)', // theme.disabled-text
      borderRadius: 6,     // rounded.md
      borderRadiusLG: 8,   // rounded.lg
      borderRadiusSM: 4,   // rounded.sm
      fontSizeLG: 16,
      controlOutlineWidth: 2,
    },
    Input: {
      colorTextPlaceholder: 'rgba(26, 26, 26, 0.3)', // theme.disabled-text
      colorTextLabel: '#1A1A1A',                     // theme.text
      colorBorder: '#E6E6E6',                        // theme.border
      colorBgContainerDisabled: '#E6E6E6',           // theme.disabled-input-background
    },
    Select: {
      optionSelectedBg: '#DFEBF6',                   // theme.option-selected
      optionActiveBg: 'rgba(223, 235, 246, 0.8)',    // theme.option-active (light-2 + CC)
      colorBgContainer: '#FFFFFF',                   // theme.surface
      colorBorder: '#E6E6E6',                        // theme.border
    },
    Table: {
      headerBg: '#DFEBF6',                           // theme.surface-secondary
      rowHoverBg: 'rgba(223, 235, 246, 0.8)',        // theme.option-active
      rowSelectedBg: '#DFEBF6',                      // theme.option-selected
      colorBorderSecondary: '#E6E6E6',               // theme.border
    },
    Form: {
      labelColor: '#1A1A1A',   // theme.text
      colorError: '#CC1F36',   // palette.error
    },
    Modal: {
      contentBg: '#FFFFFF',       // theme.surface
      headerBg: '#FFFFFF',        // theme.surface
      borderRadiusLG: 8,          // rounded.lg
      colorBgElevated: '#FFFFFF', // theme.surface
    },
    Card: {
      colorBorderSecondary: '#E6E6E6', // theme.border
      borderRadiusLG: 8,               // rounded.lg
    },
    Tabs: {
      inkBarColor: '#44576D',          // theme.primary
      itemColor: '#44576D',           // theme.text-secondary
      itemSelectedColor: '#44576D',   // theme.primary
      cardBg: '#FFFFFF',              // theme.surface
    },
    Menu: {
      darkItemBg: '#44576D',          // theme.primary
      itemMarginInline: 16,           // spacing.md
      itemBg: '#F9F6F6',              // theme.background
      colorHighlight: 'rgba(41, 53, 60, 0.8)', // theme.primary-hover
      colorBgContainer: '#FFFFFF',    // theme.surface
      itemColor: '#44576D',           // theme.primary
      itemSelectedColor: '#FFFFFF',   // theme.surface
      itemActiveBg: 'rgba(41, 53, 60, 0.8)',   // theme.primary-hover
      darkDangerItemColor: '#F9F6F6', // theme.error-text
      dangerItemColor: '#CC1F36',     // palette.error
      dangerItemSelectedBg: '#CC1F36', // theme.error-background
      darkDangerItemSelectedColor: '#F9F6F6', // theme.error-text
      darkDangerItemSelectedBg: '#CC1F36',    // theme.error-background
      itemSelectedBg: '#29353C',      // theme.primary-active
      darkItemSelectedBg: '#29353C',  // theme.primary-active
      darkDangerItemActiveBg: 'rgba(204, 31, 54, 0.3)', // theme.error-active
      dangerItemActiveBg: 'rgba(204, 31, 54, 0.3)',     // theme.error-active
      fontSize: 16,
      fontWeightStrong: 700,
      itemHoverColor: '#44576D',       // theme.primary
      dangerItemHoverColor: '#CC1F36', // palette.error
    },
    Tag: {
      defaultBg: '#DFEBF6',    // theme.surface-secondary
      defaultColor: '#1A1A1A', // theme.text
      borderRadiusSM: 4,       // rounded.sm
    },
    Badge: {
      colorError: '#CC1F36', // palette.error
    },
    Tooltip: {
      colorBgSpotlight: '#44576D',     // theme.primary
      colorTextLightSolid: '#FFFFFF',  // theme.surface
    },
    Drawer: {
      colorBgElevated: '#FFFFFF', // theme.surface
      borderRadiusLG: 8,          // rounded.lg
    },
    Notification: {
      colorBgElevated: '#FFFFFF', // theme.surface
      colorText: '#1A1A1A',       // theme.text
    },
    Pagination: {
      itemActiveBg: '#44576D',    // theme.primary
      itemActiveColor: '#FFFFFF', // theme.surface
    },
    DatePicker: {
      cellActiveWithRangeBg: '#DFEBF6',              // theme.option-selected
      cellHoverBg: 'rgba(223, 235, 246, 0.8)',       // theme.option-active
    },
    Layout: {
      colorBgHeader: '#FFFFFF', // theme.surface
      colorBgBody: '#F9F6F6',   // theme.background
    },
    Typography: {
      colorLink: '#0074A9',      // theme.link
      colorLinkHover: '#CCE5EE', // theme.link-hover
    },
    Breadcrumb: {
      fontSize: 16,
      iconFontSize: 12,
    },
    Alert: {
      colorErrorBg: '#FFB9B8',     // palette.error-light
      colorErrorBorder: '#A61129', // palette.error-dark
      colorError: '#CC1F36',       // palette.error
      colorIcon: 'inherit',
      colorWarningBg: '#FFF0C2',     // palette.warning-light
      colorWarningBorder: '#FFB833', // palette.warning-dark
      colorWarning: '#FFCC33',       // palette.warning
      colorSuccessBg: '#DBFFC5',     // palette.success-light
      colorSuccessBorder: '#107D5A', // palette.success-dark
      colorSuccess: '#10A64A',       // palette.success
      colorInfoBg: '#CCE5EE',        // palette.info-light
      colorInfoBorder: '#00528C',    // palette.info-dark
      colorInfo: '#0074A9',          // palette.info
    },
    Checkbox: {
      colorPrimary: '#44576D', // theme.primary
    },
    Radio: {
      controlHeight: 40, // spacing.2xl
    },
  },
};

export const darkTheme = {
  token: {
    colorPrimary: '#AAC7D8',        // theme.primary (dark)
    colorSuccess: '#10A64A',
    colorWarning: '#FFCC33',
    colorError: '#CC1F36',
    colorInfo: '#0074A9',

    colorBgBase: '#29353C',         // theme.background
    colorBgLayout: '#29353C',       // theme.background
    colorBgContainer: '#1A1A1A',    // theme.surface

    colorText: '#F9F6F6',           // theme.text
    colorTextSecondary: '#E6E6E6',  // theme.text-secondary
    colorTextDisabled: 'rgba(249, 246, 246, 0.3)', // theme.disabled-text
    colorBorder: '#768A96',         // theme.border

    fontFamily: 'DM Sans, sans-serif',
    fontSize: 16,
    borderRadius: 6,
    controlHeight: 40,
    lineWidth: 1,
  },
  components: {
    Button: {
      colorPrimary: '#AAC7D8',
      colorPrimaryHover: 'rgba(223, 235, 246, 0.8)',
      colorPrimaryActive: '#DFEBF6',
      colorPrimaryTextHover: '#1A1A1A',           // theme.surface
      colorErrorBg: '#FFB9B8',                    // theme.error-background (dark)
      colorErrorBorder: '#FFB9B8',
      colorErrorText: '#CC1F36',                  // theme.error-text (dark)
      colorBgContainerDisabled: 'rgba(170, 199, 216, 0.3)',
      colorTextDisabled: 'rgba(249, 246, 246, 0.3)',
      borderRadius: 6,
      borderRadiusLG: 8,
      borderRadiusSM: 4,
      fontSizeLG: 16,
      controlOutlineWidth: 2,
    },
    Input: {
      colorTextPlaceholder: 'rgba(249, 246, 246, 0.3)',
      colorTextLabel: '#F9F6F6',
      colorBorder: '#768A96',
      colorBgContainerDisabled: '#44576D', // theme.disabled-input-background (dark)
    },
    Select: {
      optionSelectedBg: '#44576D',                 // theme.option-selected (dark)
      optionActiveBg: 'rgba(68, 87, 109, 0.8)',    // theme.option-active (dark-1 + CC)
      colorBgContainer: '#1A1A1A',
      colorBorder: '#768A96',
    },
    Table: {
      headerBg: '#44576D',                         // theme.surface-secondary (dark)
      rowHoverBg: 'rgba(68, 87, 109, 0.8)',
      rowSelectedBg: '#44576D',
      colorBorderSecondary: '#768A96',
    },
    Form: {
      labelColor: '#F9F6F6',
      colorError: '#CC1F36',
    },
    Modal: {
      contentBg: '#1A1A1A',
      headerBg: '#1A1A1A',
      borderRadiusLG: 8,
      colorBgElevated: '#1A1A1A',
    },
    Card: {
      colorBorderSecondary: '#768A96',
      borderRadiusLG: 8,
    },
    Tabs: {
      inkBarColor: '#AAC7D8',
      itemColor: '#E6E6E6',
      itemSelectedColor: '#AAC7D8',
      cardBg: '#1A1A1A',
    },
    Menu: {
      darkItemBg: '#AAC7D8',
      itemMarginInline: 16,
      itemBg: '#29353C',
      colorHighlight: 'rgba(223, 235, 246, 0.8)',
      colorBgContainer: '#1A1A1A',
      itemColor: '#AAC7D8',
      itemSelectedColor: '#1A1A1A',
      itemActiveBg: 'rgba(223, 235, 246, 0.8)',
      darkDangerItemColor: '#CC1F36',
      dangerItemColor: '#CC1F36',
      dangerItemSelectedBg: '#FFB9B8',
      darkDangerItemSelectedColor: '#CC1F36',
      darkDangerItemSelectedBg: '#FFB9B8',
      itemSelectedBg: '#DFEBF6',
      darkItemSelectedBg: '#DFEBF6',
      darkDangerItemActiveBg: 'rgba(204, 31, 54, 0.3)',
      dangerItemActiveBg: 'rgba(204, 31, 54, 0.3)',
      fontSize: 16,
      fontWeightStrong: 700,
      itemHoverColor: '#AAC7D8',
      dangerItemHoverColor: '#CC1F36',
    },
    Tag: {
      defaultBg: '#44576D',    // theme.surface-secondary (dark)
      defaultColor: '#F9F6F6', // theme.text
      borderRadiusSM: 4,
    },
    Badge: {
      colorError: '#CC1F36',
    },
    Tooltip: {
      colorBgSpotlight: '#AAC7D8',
      colorTextLightSolid: '#1A1A1A',
    },
    Drawer: {
      colorBgElevated: '#1A1A1A',
      borderRadiusLG: 8,
    },
    Notification: {
      colorBgElevated: '#1A1A1A',
      colorText: '#F9F6F6',
    },
    Pagination: {
      itemActiveBg: '#AAC7D8',
      itemActiveColor: '#1A1A1A',
    },
    DatePicker: {
      cellActiveWithRangeBg: '#44576D',
      cellHoverBg: 'rgba(68, 87, 109, 0.8)',
    },
    Layout: {
      colorBgHeader: '#1A1A1A',
      colorBgBody: '#29353C',
    },
    Typography: {
      colorLink: '#CCE5EE',      // theme.link (dark)
      colorLinkHover: '#0074A9', // theme.link-hover (dark)
    },
    Breadcrumb: {
      fontSize: 16,
      iconFontSize: 12,
    },
    Alert: {
      colorErrorBg: '#FFB9B8',
      colorErrorBorder: '#A61129',
      colorError: '#CC1F36',
      colorIcon: 'inherit',
      colorWarningBg: '#FFF0C2',
      colorWarningBorder: '#FFB833',
      colorWarning: '#FFCC33',
      colorSuccessBg: '#DBFFC5',
      colorSuccessBorder: '#107D5A',
      colorSuccess: '#10A64A',
      colorInfoBg: '#CCE5EE',
      colorInfoBorder: '#00528C',
      colorInfo: '#0074A9',
    },
    Checkbox: {
      colorPrimary: '#AAC7D8',
    },
    Radio: {
      controlHeight: 40,
    },
  },
};
```

## Audit Guide

When reviewing the live application, report any styling that falls outside the tokens and mappings defined in this file. Prioritize hardcoded colors, hardcoded spacing, custom radii, custom shadows, inline styles, `!important`, and Ant Design overrides that bypass the approved token set. Differences between similar menus, tables, buttons, alerts, or step indicators should also be flagged when they are not explained by the token map.

## Example Findings

| Severity | Location | Expected Value | Actual Value | Suggested Fix | Reason |
|----------|----------|----------------|--------------|---------------|--------|
| Critical | Button primary hover | `colors.theme.background` | Hardcoded `#F9F6F6` in local CSS | Replace with token reference | Keeps background color tokenized and auditable, allows for light/dark mode flexibility |
| Warning | Table header | `colors.theme.surface-secondary` | `#DFEBF6` inline | Move to token or existing alias | Prevents one-off table styling drift, allows for light/dark mode flexibility |