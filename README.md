# Savings Account — interactive prototype

Standalone HTML prototype of Loop's **Accounts** page plus the new **Savings account**
feature (product overview + ENG-2988 "create financial account" UI).

- **`index.html`** — the deliverable. Single self-contained file (fonts, icons, flags,
  logo all inlined). Open it directly in a browser; no server, no network.
- **`app.html`** — source template. Edit this.
- **`build.js`** — `node build.js` → regenerates `index.html` from `app.html`.

```sh
node build.js && open index.html
```

Live: <https://rebeccasunloop.github.io/loop-savings-account/> (GitHub Pages, `main`/root —
it redeploys on push, so commit the regenerated `index.html` alongside `app.html`).

## Figma

The prototype has been transcribed into
[Savings Account](https://www.figma.com/design/3pfyJrW5czuhYpYIA24aNV/Savings-Account)
(file key `3pfyJrW5czuhYpYIA24aNV`) as a component library:

- **Foundations** — 101 variables: 39 primitives (brand ramp derived with the same
  `oklch(from --loop-green …)` maths as `theme.css`, Tailwind v4 neutral/green/red, Loop's
  named palette, the `#F8FAFC`/`#D3DAE4` action pair), 43 semantic colours aliased across
  Light/Dark modes, 18 spacing/radius, 1 typography. All scoped, all with `var()` code
  syntax. Plus 12 text styles and 6 effect styles.
- **Components** — 46 Untitled UI icons and 3 currency flags from the real path data, then
  Button (18 variants), Badge, Segmented control, Tabs, Input, Select trigger, Menu item,
  Menu tile item, Add Account / filter popovers, Account row, Accounts table, Area chart,
  Chart card, Interest panel, Sidebar, Top nav and three modals.
- **Screens** — Accounts list and savings account detail, assembled from instances.

Two substitutions to know: **Articulat CF isn't available in that Figma org**, so type uses
Inter — `theme.css`'s own declared fallback — with family bound to a `font/family` variable
so installing Articulat is a one-value swap. And the sidebar wordmark is a text
placeholder pending the real brand component.

Not yet built there: transaction/tax-document rows, the interest bar chart, and Code
Connect mappings. The detail screen's chart-card instance also needs an auto-layout fix
(the component itself is correct).

## Where the design comes from

| Concern | Source of truth |
| --- | --- |
| Flows, savings detail layout, add/edit flows | `~/Downloads/Accounts demo with add and edit flows/Accounts.dc.html` |
| Chrome, tokens, component styling | `~/Documents/next-app` (Loop's codebase) |
| Production reference screenshots | that folder's `uploads/` + the Accounts screenshot in the brief |

Everything visual is pulled from `next-app`, not approximated:

- **Tokens** — `src/styles/variables.css` + `theme.css`, including the `oklch(from …)`
  brand ramp derivation and the full `.dark` semantic map.
- **Type** — Articulat CF, the same four faces the app ships (no 600 weight exists, so
  `font-weight:600` resolves to Bold exactly as in production).
- **Icons** — real `@untitledui/icons` path data, extracted at build time.
- **Chrome** — sidebar `w-60` / collapsed `48px`, `sidebar-nav-item` (p-2, 5px radius,
  hover `neutral-200` → `brand-500`, dark hover `neutral-800` → `bright-green`), 64px
  top nav right-aligned with the business switcher, `main` at `px-8`.
- **Components** — Button sizes/colors from `base/buttons/button.tsx` (incl. the
  skeuomorphic inset shadow on secondary/filter), `Dropdown.Popover` (`rounded-lg`,
  `shadow-lg`, `ring-secondary`, `text-sm font-semibold` items), `ui/table.tsx`
  (`rounded-2xl`, `border-secondary`, `shadow-xs`), `TimeRangeSelector`, `DeltaBadge`,
  `AccountBalanceChart` (dashed `3 4` grid, `utility-brand-600` line, 0.18→0 gradient).
  The currency / account-type fields are a listbox rather than a native `<select>`, since
  the options carry a flag and a sub-label — same shape as `base/select`'s items.

**Both themes** are implemented via the `.dark` class, switched from the business menu →
Appearance (System / Light / Dark), same as `top-nav.tsx`. Choice persists in
`localStorage`.

## What's in it

**Accounts list** — estimated total balance (CAD-converted at indicative rates) with a
hoverable area chart and 7d/30d/90d/12m ranges; `All Accounts / Operating / Savings /
Linked` filter; sortable columns; nickname + system-name rows; row menu (view details,
edit nickname); Add Account menu → Operating / Savings / Link external.

**Create savings account (ENG-2988)** — currency (defaults CAD, each option carrying its
flag and country, with per-currency caps shown inline as "Already opened") + account type
(defaults Savings) + optional nickname, inline validation when a field is cleared,
loading state, then a success view covering both `active` and pending provisioning,
with the account id and **View account details**. Domain errors are mapped from
`extensions.code`: `validation_failed` (inline), `forbidden`, `conflict`,
`account_holder_not_provisioned`, `account_holder_not_found`.

**Savings detail** — Add Funds / Withdraw / Convert / View Statements / Tax Documents
(no Send Payment, no e-Transfer — savings is Loop-to-Loop only). No Pending In /
Processing Out either: with no external rails, both are structurally always zero. The chart card has one
header: Balance ⇄ Interest Earned as underline tabs, with the period pills below the
divider on the label row, right-aligned as production has them. The headline
follows the selected view — Available balance, or interest earned over the period — so
the number and its label always agree. Side panel carries interest earned last month,
lifetime interest, APY and next payout, and a footer button opening the protection dialog
(production's CDIC + RPAA copy, currency-aware). A **Tax Documents** modal lists T5s per
completed tax year with a download per slip, and an empty state until the first year
closes. Then Recent Transactions. Empty states throughout for a freshly created account.

**Also wired** — operating-account creation with plan usage + limit-reached upgrade
state, link external account, edit nickname, Add Funds / Withdraw between Loop accounts
(with balance validation), toasts, Escape/backdrop dismissal, hash routes
(`#/accounts`, `#/accounts/<id>`), sidebar collapse.

**Prototype controls** (bottom-left, collapsible) — appearance, the
`registerFinancialAccount` outcome to simulate (success/pending/each error code), the
`enable-create-financial-account` PostHog flag (off = today's page, with just *Link
External Account*), and reset.

## Decisions worth reviewing

1. **CAD + USD savings, not CAD-only.** ENG-2988 scopes the milestone to CAD, but the
   product overview and the demo both cover USD, and the one-per-currency cap only
   reads correctly with two. EUR/GBP appear disabled ("not available yet"); Deposit and
   Virtual account types appear disabled ("coming soon"), so the widening path is
   visible. Flip `CURRENCIES` / `ACCOUNT_KINDS` in `app.html` for CAD-only.
2. **"Add Account" replaces "Link External Account"**, per the account-page notes —
   which conflicts with the PR's "next to Link External Account". Both are in here: the
   PostHog flag toggles between them.
3. **Tax documents has one entry point**: the *View Tax Documents* action, which opens a
   modal. The meeting notes asked for a tab, but a T5 is issued once a year — too little
   content to hold a tab. Row per slip, in the shape production uses for statements.
4. **Two-line account rows** (display name + descriptor) from the demo, rather than
   production's single line — with nicknames surfaced, the second line is what tells
   you which underlying account you're looking at. Worth confirming.
5. **Seed data** ships one existing **USD** savings account with 18 months of interest,
   so the populated design is visible immediately, and leaves **CAD** open so the
   creation flow can be run end-to-end. Only savings rows navigate; operating-account
   detail pages are out of scope.
6. **Neutral surfaces use `#F8FAFC` → `#D3DAE4` on hover**: the Add Account menu tiles
   (icon stroke darkens with them), the detail page's secondary action pills, and the
   All Accounts filter chip — buttons hover to `#CDD5DF`, the menu tiles to `#D3DAE4`. `#045B3F` with white text is the one solid action per page —
   Add Account on the list, Add Funds on the detail page. Those hexes are slate, not on Loop's
   neutral (pure grey) ramp, so they sit in the CSS as literal values; dark mode maps the
   pair to `bg-tertiary` / `bg-quaternary`. Measured contrast: 17.1:1 rest and 12.7:1
   hover in light (12.1:1 on the buttons' `#CDD5DF`), 14.5:1 / 9.9:1 in dark, 8.2:1 for
   white on the green — all past AA.
   Consequence: no lilac is left in the UI, so the DS's `color="filter"` Button variant
   goes unused here even though production still uses it for that chip.
7. **`--color-fg-quaternary` in dark mode** is `neutral-500` here, not `theme.css`'s
   `--loop-bright-purple` — purple icon chrome reads as an accent/bug in review. Single
   deliberate token deviation.
8. Interest rate (3.25% APY), FX rates and T5 issue dates are **placeholders** for
   layout only. The protection modal uses production's CDIC + RPAA copy verbatim, which
   is CAD-specific ("Loop CAD Account Balances are held at Bank of Montreal®"). Non-CAD
   accounts get the same sentence with no institution named, since the real partner per
   currency needs compliance input — that clause is the one thing to check before use. Open
   items from the meeting ("operating" vs "deposit account" naming, Nickname vs Rename)
   are still unresolved in the copy.

Verified in Chromium (light + dark) across the list, both detail states, all modals,
validation and error states — no console errors.
