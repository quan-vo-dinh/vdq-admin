# App typography

Updated 21 October 2026. The UI uses one readable scale, defined in `app/globals.css` through Tailwind theme tokens. Values below assume the browser's default 16px root size; all tokens use rem and respect user font settings and zoom.

| Token | Size | Role |
| --- | --- | --- |
| `text-xs` | 14px | Minimum UI size: metadata, badges, keyboard hints, chart labels |
| `text-sm` | 15px | Buttons, navigation, labels, descriptions, table text |
| `text-base` | 16px | Main copy, dialog/card content, native form inputs, textareas |
| `text-lg` | 18px | Section, card, dialog and empty-state titles |
| `text-xl` | 22px | Standard page headings |
| `text-2xl` | 26px | Prominent page headings and summary values |

Larger metrics retain the existing larger tokens. Distinguish hierarchy with weight, color and spacing rather than shrinking secondary text below the minimum. UI text should not introduce literal 10px/11px/12px values or arbitrary rem equivalents. User-authored rich text, source images and media are not rewritten.

The Lyra theme consumes these tokens consistently: formerly compact 12px copy is now 15px; main surfaces use 16px and titles 18px. Compact badges and chart hints use the 14px minimum. Native inputs and textareas use 16px at all breakpoints. No root font-size increase or CSS zoom is used, so spacing, dialog widths and viewport calculations keep their established dimensions.

Default buttons and inputs have 36px height; small buttons 32px; xs buttons 28px. Default selects and tabs also gain room for the new font sizes. Compact introductions use minimum heights and natural line heights rather than clipping the larger headings into the old 24px/18px text boxes. Feature-specific line clamps remain intentional; full article text remains available in previews.

Literal sub-14px UI sizes were migrated to tokens. Recharts axis/legend labels and the activity calendar use a minimum of 14px. Check chart bounds after adding long labels; keep table scrolling and responsive control wrapping instead of reducing font size to fit.

Verification: production build and TypeScript passed. Browser measurements on the accessible login page confirm a 16px root, the shared 14/15/16/18/22/26px token scale, 15px login copy and button text, and 16px branding. Authenticated Developer, Feed, Finance, Calendar and dialog layout QA remains outstanding because the test browser redirects to GitHub login. Do not infer dashboard visual acceptance from these token and build checks.
