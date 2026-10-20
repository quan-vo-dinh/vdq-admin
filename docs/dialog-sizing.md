# Dialog sizing

`DialogContent` owns popup dimensions. The Lyra theme owns appearance and must not set width or max-width: its scoped selector previously overrode page-specific width utilities, shrinking previews and forms to `sm:max-w-sm`.

Use the `size` prop according to the content:

| Size | Maximum width at 16px root | Intended content |
| --- | --- | --- |
| `sm` | 448px | confirmations, short link inputs, small status summaries |
| `md` (default) | 672px | standard transaction, goal, habit and settings forms |
| `lg` | 896px | article preview, rich note editor, calendar editor, profile forms, connection setup/details, activity reports |
| `xl` | 1152px | CSV preview tables, large connection/source panels |
| `full` | viewport minus 32px | future dense previews that need all available width |

All sizes are capped by `width: calc(100vw - 2rem)`, leaving a 16px gutter on either side even when the maximum is larger than the screen. Base height is capped at viewport height minus 32px with vertical scrolling; feature-specific shorter height constraints remain supported. Dialogs do not need breakpoint-specific max-width classes. Use responsive grids inside forms; wide tables should have their own horizontal scroll container.

Example: `<DialogContent size="lg">…</DialogContent>`. Reserve `sm` for concise dialogs; do not make every workflow use the same width. `AlertDialog` confirmations and navigation `Sheet` panels retain their separate sizing conventions.

Verification: production build and TypeScript pass. Built CSS confirms the Lyra `.cn-dialog-content` rule no longer sets maximum width. Browser access reached the GitHub login screen, so authenticated popup dimensions and mobile screenshots still require visual acceptance. Existing lint errors in profile and blog code, and a Finance warning, are outside this sizing change. Full lint reports 21 errors and 46 warnings.
