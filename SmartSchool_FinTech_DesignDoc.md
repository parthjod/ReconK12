# SmartSchool FinTech

Design Doc — Visual System & UI/UX Specification

*Frosted glass, pastel gradients, and a dashboard that thinks like a
finance officer*

## 1. Tooling & Process Note

This design should be produced using the frontend-design skill for
aesthetic direction and self-critique, the ui-ux-pro-max-skill for
component-level UX heuristics and accessibility checks, and
21st.dev-style component patterns (shadcn/ui-compatible) as the base
building blocks for buttons, cards, tables, and dialogs — restyled per
the token system below rather than used as defaults out of the box. No
component should ship looking like an unedited library default; every
token in this doc must visibly show up in the final build.

## 2. Design Brief Interpretation

The subject is a school finance office: a place that is simultaneously
bureaucratic (receipts, ledgers, due dates) and caretaking (a school,
kids, parents). The brief explicitly calls for soft frosted glass and
pastel gradients — so the risk to take is making a financial dashboard
feel calm and legible rather than alarm-toned red/green like a stock
ticker. The signature element: a \'Collection Pulse\' — a living,
softly animated gradient ring around the day\'s revenue number that
fills as payments land in real time, turning the driest metric in the
product into the one moment of delight.

## 3. Design Tokens

### 3.1 Color

  ——————-- ——————-- —————————--
  **Token**            **Hex**              **Usage**

  Base Mist            #F4F5FC              App background

  Glass White          #FFFFFF @ 60% + blur Card surfaces (frosted glass)

  Iris (Primary)       #8B7CF6              Primary actions, active
                                            states

  Peach (Accent)       #FFB4A2              Gradient partner, warm
                                            highlights

  Mint (Positive)      #9AE6B4              Collected / reconciled states

  Clay (Risk)          #F4A896              Overdue / defaulter signals
                                            — warm clay, not alarm red

  Ink                  #2B2A3A              Primary text
  ——————-- ——————-- —————————--

Signature gradient: linear-gradient(135deg, #8B7CF6 0%, #FFB4A2 100%)
— used only on the Collection Pulse ring and primary CTA, nowhere
else, so it stays special.

### 3.2 Typography

-   Display face: Fraunces (variable, soft-serif) for the revenue hero
    number and section headers — a serif with warmth to counter
    typical fintech\'s cold grotesques.

-   Body/UI face: Inter for all body copy, table data, and form labels
    — high legibility at small sizes.

-   Data/mono face: JetBrains Mono for transaction IDs, amounts in
    tables, and receipt numbers — gives financial figures a tabular,
    trustworthy rhythm.

-   Scale: 44/32/24/18/15/13px with 1.15--1.4 line-height depending on
    role; hero numbers use tabular-nums.

### 3.3 Layout

-   12-column grid, 24px gutter, cards on an 8px spacing baseline.

-   Frosted glass cards: background blur(20px), 1px hairline border at
    10% white opacity, 20px corner radius, soft ambient shadow (never
    hard drop shadows).

-   Dashboard uses a \'pulse + rows\' layout: hero pulse ring top-left,
    revenue breakdown chart top-right, prioritized defaulter list as the
    dominant lower region (it gets the most vertical space — it\'s the
    action queue, not an afterthought).

## 4. Screen Specifications

### 4.1 Admin Dashboard (Home)

-   Top bar: school name, term selector, search, profile — plain, no
    glass effect here (keep chrome quiet).

-   Hero region: Collection Pulse ring (animated gradient fill = % of
    monthly target collected), with today/week/month toggle as pill
    tabs.

-   Revenue breakdown: donut + bar hybrid by fee head and by channel
    (UPI/cash/cheque/bank), frosted card, hover reveals exact amounts
    via a soft tooltip.

-   Prioritized defaulter list: each row is a frosted card, not a table
    row — avatar-style initials, days overdue, risk badge
    (Low/Med/High in mint/peach/clay, never harsh red), and inline
    quick-action buttons (Remind, Waive, Log Promise, Call) that appear
    on hover/focus, not permanently cluttering the row.

-   Empty/zero state for a fully-collected class: a small congratulatory
    illustration line, not a blank table — \'All caught up for Grade
    6-B\' with a subtle confetti-gradient accent, reusing the signature
    gradient sparingly.

### 4.2 Fee Engine (Configuration)

-   Builder-style UI: left panel lists fee heads as glass chips; right
    panel is a form-in-a-drawer for structure (amount, frequency,
    applicable classes, exceptions) — never a full-page modal that
    loses context.

-   Exception rules (waivers/penalties) shown as attached \'rule tags\'
    on the fee head chip itself, so an admin sees at a glance that Grade
    3 Tuition has a sibling-discount rule without opening it.

### 4.3 Payments & Reconciliation

-   Channel tabs (UPI / Cash / Cheque / Bank Import) rather than one
    giant merged table — each channel has a distinct, minimal
    iconographic accent color from the token set, not full theme
    changes.

-   Reconciliation state shown as a stepped progress pill (Logged →
    Matched → Settled) inline per transaction, using motion only on
    state change (a quick 200ms fill), not looping animation.

-   Cash entry flow (mobile companion): single-screen form — student
    search, amount, optional note, big Confirm button; a small offline
    indicator (cloud-with-slash icon) appears if unsynced, and syncs
    silently with a brief toast on reconnect: \'3 receipts synced.\'

## 5. Motion Principles

-   One orchestrated moment: the Collection Pulse ring fills live as
    payments land — this is the single animated \'wow\' moment of the
    product.

-   Everywhere else: motion is functional and brief (150--250ms
    ease-out) — state changes, hover reveals, toasts. No idle/looping
    decorative animation on cards or backgrounds.

-   Respect prefers-reduced-motion: the Pulse ring becomes a static
    progress arc with no animation when set.

## 6. Accessibility & Responsiveness

-   All frosted-glass text passes WCAG AA contrast against the blurred
    background at every supported wallpaper/theme — verify with the
    ui-ux-pro-max-skill\'s contrast checks before shipping any card
    variant.

-   Risk badges use color + icon + text label together (never color
    alone) so risk level reads correctly for color-blind users.

-   Full keyboard navigation with a visible focus ring using the Iris
    token at 2px, not the browser default.

-   Dashboard collapses to a single-column stack below 768px: Pulse ring
    shrinks but stays top-most, defaulter cards become full-width, quick
    actions collapse into a single overflow (•••) menu with the same
    actions.

## 7. Component Build Notes (21st.dev / shadcn base)

-   Use shadcn/ui primitives (Card, Tabs, Dialog, Badge, DropdownMenu)
    as structural scaffolding only — every visual property (radius,
    shadow, border, color) must be overridden per the token table in
    Section 3, not left at library defaults.

-   Pull layout/composition inspiration from 21st.dev component patterns
    for the dashboard card grid and the stepped-progress reconciliation
    pill, adapting proportions to the glass/pastel system rather than
    copying their default theme.

-   Before finalizing any screen, run the frontend-design skill\'s
    brainstorm → critique loop: state the token/layout choice, check it
    against the \'does this look like any similar hackathon dashboard\'
    test, and revise anything that reads as a generic default.

## 8. Signature Element Recap

The Collection Pulse: a soft gradient ring (Iris → Peach) around the
day\'s revenue figure, in Fraunces numerals, that visibly fills in real
time as UPI, cash, and cheque payments are reconciled. It is the one
place boldness is spent — everything else in the interface stays
quiet, legible, and calm.
