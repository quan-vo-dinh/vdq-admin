# P12 route acceptance matrix — in progress

Every entry compiles from shared source. This is not a native acceptance certificate.
No row is accepted on Android until exercised on a real device.

| Route | Source/build | Mobile browser observation | Android |
|---|---|---|---|
| `/apps/blog/create` | Shared view compiles | Pending | Pending real device |
| `/apps/blog/detail/:slug` | Shared view compiles | Pending | Pending real device |
| `/apps/blog/edit` | Shared view compiles | Pending | Pending real device |
| `/apps/blog/manage-blog` | Shared view compiles | Pending | Pending real device |
| `/apps/blog/post` | Shared view compiles | Pending | Pending real device |
| `/apps/calendar` | Shared view compiles | Pending | Pending real device |
| `/apps/notes` | Shared view compiles | Pending | Pending real device |
| `/apps/tickets/create` | Redirect /apps/tickets | Pending | Pending real device |
| `/apps/tickets` | Shared view compiles | Pending | Pending real device |
| `/developer/ai` | Shared view compiles | Pending | Pending real device |
| `/developer/connections` | Shared view compiles | Pending | Pending real device |
| `/developer/feed` | Shared view compiles | Pending | Pending real device |
| `/developer/github` | Redirect /developer | Pending | Pending real device |
| `/developer/inbox` | Redirect /developer?view=inbox | Pending | Pending real device |
| `/developer` | Shared view compiles | Observed authenticated overview | Pending real device |
| `/developer/reports` | Redirect /developer?panel=reports | Pending | Pending real device |
| `/developer/sources` | Redirect /developer?panel=sources | Pending | Pending real device |
| `/finance/budgets` | Shared view compiles | Observed Radar tab selection | Pending real device |
| `/finance/cash-flow` | Shared view compiles | Pending | Pending real device |
| `/finance/goals` | Shared view compiles | Observed empty state/editor/picker controls; cancelled without write | Pending real device |
| `/finance` | Shared view compiles | Observed real local data/chart | Pending real device |
| `/finance/transactions` | Shared view compiles | Observed real local data; CSV download outcome unverified (timeout) | Pending real device |
| `/icons/iconify` | Shared view compiles | Pending | Pending real device |
| `/` | Redirect /developer | Pending | Pending real device |
| `/pages/form` | Shared view compiles | Pending | Pending real device |
| `/pages/tables` | Shared view compiles | Pending | Pending real device |
| `/pages/user-profile` | Shared view compiles | Pending | Pending real device |
| `/auth/auth2/register` | Shared view compiles | Pending | Pending real device |
| `/auth/auth2/forgot-password` | Shared view compiles | Pending | Pending real device |
| `/auth/auth2/two-steps` | Shared view compiles | Pending | Pending real device |
| `/auth/error` | Shared view compiles | Pending | Pending real device |
| `/auth/maintenance` | Shared view compiles | Pending | Pending real device |

Dedicated mobile credentials login was completed by the user in host-managed Chrome;
GitHub native login/consent/PKCE redirect remains pending real provider/device acceptance.
Browser capability later disabled by host. See P12.md for test boundaries.
