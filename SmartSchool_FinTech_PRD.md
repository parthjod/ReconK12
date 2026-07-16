# SmartSchool FinTech

Product Requirements Document

*A unified fee management & collections platform for K-12 schools*

## 1. Executive Summary

SmartSchool FinTech is a fee management platform built around one
insight that most competing systems miss: school fee collection is not a
single payment flow, it is a reconciliation problem wearing a payments
costume. Parents pay via UPI, cash handed to a class teacher, a cheque
dropped at the front office, or a partial installment against a sibling
discount — and every one of those has to land in the same ledger, on
the same day, without a human re-typing anything twice.

This PRD defines a system whose core differentiator is a real-time,
auto-reconciling ledger with an offline-first mobile companion for
front-desk and transport-fee cash collection, plus a zero-platform-fee
UPI rail. The admin experience is built to feel like a finance cockpit,
not a spreadsheet viewer: live revenue pulse, a prioritized (not just
sorted) defaulter queue, and one-tap contextual actions.

## 2. Problem Statement (Restated)

-   School finance offices juggle spreadsheets, paper receipts, and
    disconnected software with no single source of truth.

-   Reconciling UPI, cash, and cheque payments against a fee structure
    with waivers, discounts, and penalties is manual and error-prone.

-   Front-office and transport staff need offline-capable cash workflows
    that sync later without creating duplicate or lost entries.

-   Administrators need to see, at a glance, who owes what, why, and
    what to do about it next — not just a table of transactions.

## 3. Goals & Non-Goals

### Goals

-   Give every school a single ledger of record across UPI, cash,
    cheque, and bank transfer.

-   Support a fully configurable fee engine: any fee head, any
    frequency, any student segment, any exception.

-   Make cash collection offline-safe: capture on a phone with no
    signal, reconcile automatically the moment it\'s back online.

-   Turn the admin dashboard into a decision-making surface, not a
    reporting surface.

-   Zero platform fee on UPI collections — a direct answer to
    schools\' single biggest cost complaint with existing ERPs.

### Non-Goals (v1)

-   Full accounting/GL software (tax filing, payroll, vendor AP) —
    SmartSchool exports clean data to existing accounting tools instead
    of replacing them.

-   Learning management, attendance, or academic record features.

-   International currency / multi-country tax compliance (v1 targets
    India-first, UPI-centric schools).

## 4. Personas

  ———————-- ————————- ———————-
  **Persona**             **Context**               **Core Need**

  Finance Admin (Priya)   Runs fee collection for a One dashboard that
                          1,200-student school,     shows collection
                          currently on Excel + a    status and defaulters
                          legacy ERP                without manual
                                                    cross-checking

  Front Desk / Transport  Collects cash fees at the A dead-simple app to
  Staff (Ramesh)          gate or on the bus route, record a cash receipt
                          patchy connectivity       in under 15 seconds,
                                                    even offline

  Parent (Anita)          Pays fees for two         One link or app to pay
                          children on different fee via UPI, see what\'s
                          plans                     due, why, and get an
                                                    instant receipt

  Principal / Trustee     Wants a monthly financial A trustworthy summary:
  (Mr. Verma)             pulse without asking the  collected vs.
                          finance team              outstanding, trend,
                                                    top risk segments
  ———————-- ————————- ———————-

## 5. Core Feature Set

### 5.1 Dynamic Fee Engine

A rules-based fee configuration layer so admins can create, modify, or
retire any fee head without a developer.

-   Fee heads: tuition, transport, hostel, exam, activity, late fee,
    security deposit — all user-definable, not hardcoded.

-   Structures: one-time, recurring (monthly/quarterly/annual),
    installment plans, and class/grade/route-based variants.

-   Exceptions as first-class objects: sibling discounts, scholarships,
    staff-ward waivers, and penalty rules (e.g., 2% after due date,
    capped at ₹500) are modeled as auditable rule objects, not manual
    ledger edits.

-   Versioning: every fee-structure change is timestamped and scoped to
    an academic year, so last year\'s invoices never silently change.

### 5.2 Comprehensive Data Management

-   A single transaction ledger normalizes UPI, cash, cheque, and
    bank-transfer entries into one schema with a common state machine
    (Pending → Reconciled → Settled / Bounced / Refunded).

-   Every waiver and penalty is linked to the specific invoice line and
    rule that produced it — full audit trail, not a flat discount
    field.

-   Double-entry-inspired internal ledger (even though this isn\'t full
    GL software) so debits and credits always balance per student
    account.

### 5.3 Omnichannel Payments

-   Zero-fee UPI: direct UPI intent/collect integration (e.g., via a
    payment aggregator\'s UPI-only route) so schools don\'t absorb
    card-style MDR on a payment rail that\'s free at the rail level in
    India.

-   Cash & cheque reconciliation workflow: staff log a cash receipt on a
    mobile app; it queues locally if offline and syncs the moment
    connectivity returns, matching automatically against the expected
    fee due.

-   Cheque lifecycle tracking: logged → deposited → cleared/bounced,
    with automatic penalty triggers on bounce.

-   Bank statement import + fuzzy matching to auto-reconcile stray
    UPI/NEFT transfers that don\'t arrive through the app.

### 5.4 Admin Dashboard

-   Real-time revenue metrics: collected today/this week/this month vs.
    target, animated on change, not just a static number.

-   Prioritized defaulter tracking: ranked not just by amount overdue
    but by a risk score combining days overdue, payment history, and
    communication responsiveness — so the finance team calls the right
    five parents first, not the top five by rupee amount.

-   Revenue breakdown: by fee head, by class, by payment channel, with
    drill-down.

-   Quick-action contextual buttons: send reminder, apply waiver, log a
    promise-to-pay, initiate refund — surfaced directly on the row
    they apply to, not buried in a separate menu.

## 6. Key Differentiators

  ——————————- —————————————
  **Typical School ERP**          **SmartSchool FinTech**

  Static discount/late-fee fields Rule-based, auditable fee engine with
                                  versioning

  Cash entry requires network     Offline-first capture with automatic
  connection                      sync & reconciliation

  Defaulter list sorted by amount Defaulter list prioritized by a
                                  risk/urgency score

  UPI routed through card-style   Zero-fee UPI collection rail
  gateway (MDR applies)           

  Dashboard = table of numbers    Dashboard = decision surface with
                                  contextual actions
  ——————————- —————————————

## 7. Proposed Architecture

### 7.1 High-level

-   Mobile app (Flutter) for parents and front-desk/transport staff —
    chosen for one codebase across Android/iOS and strong
    offline-storage support.

-   State management: Riverpod, specifically because fee/payment data is
    inherently asynchronous (pending sync, webhook confirmations,
    background reconciliation) and Riverpod\'s provider/notifier model
    keeps that async state predictable and testable versus ad-hoc
    setState or Provider-only approaches.

-   Web admin dashboard (React) for finance staff and principals.

-   Backend: a modular service layer — Fee Engine service,
    Ledger/Reconciliation service, Payments Gateway adapter,
    Notification service — behind a single API gateway.

-   Database: PostgreSQL as the system of record (relational integrity
    for ledgers/invoices) with a lightweight event log (append-only) for
    every state transition, enabling full audit and replay.

-   Offline sync: local SQLite/Isar store on the mobile app with a
    queued outbox pattern; conflict resolution favors server-confirmed
    state with client entries replayed against the latest fee rules.

### 7.2 Data Model (core entities)

-   Student, GuardianAccount, FeeHead, FeeStructure (versioned),
    Invoice, InvoiceLine, Transaction (channel, status, external_ref),
    WaiverRule, PenaltyRule, ReconciliationEvent.

### 7.3 Security & Compliance

-   PCI scope minimized by never touching raw card data — UPI
    intent/collect flows keep card PANs out of the system entirely.

-   Role-based access control: front-desk staff can log cash but not
    modify fee structures; only finance admins can create waivers above
    a threshold, which then require a second approval.

-   All financial mutations are append-only events; the current-state
    tables are derived, so nothing is truly overwritten.

-   Data protection aligned to India\'s DPDP Act expectations for
    student/guardian personal data — encryption at rest and in
    transit, minimal retention of payment instrument identifiers.

## 8. Success Metrics

  ——————————————- —————————
  **Metric**                                  **Target**

  Time to log a cash receipt (offline)        \< 15 seconds

  Auto-reconciliation rate (UPI + bank        \> 95% without manual
  import)                                     matching

  Reduction in fee-collection follow-up calls 30%+ via prioritized
                                              defaulter queue

  Dashboard load time (first meaningful       \< 1.5s on a mid-range
  paint)                                      Android device

  Platform fee on UPI collections             0%
  ——————————————- —————————

## 9. Roadmap

-   Phase 1 (Hackathon MVP): Fee engine + invoice generation, UPI
    collection, manual cash entry (online), admin dashboard with
    real-time metrics and defaulter list.

-   Phase 2: Offline cash capture & sync, cheque lifecycle tracking,
    bank-statement fuzzy reconciliation.

-   Phase 3: Risk-scored defaulter prioritization, automated reminder
    sequencing, parent-facing payment app with saved fee plans.

-   Phase 4: Multi-school/franchise support, exportable accounting
    integrations, WhatsApp-based payment reminders and receipts.

## 10. Risks & Mitigations

  ——————————— ————————————-
  **Risk**                          **Mitigation**

  Offline sync conflicts (duplicate Idempotency keys per receipt +
  cash entries)                     server-side dedup against invoice +
                                    amount + timestamp window

  UPI collection API downtime       Fallback to payment-link based
                                    collection; queued retry

  Zero-fee UPI margin               Monetize via optional premium
  sustainability                    reporting/analytics tier and
                                    financing/installment partnerships,
                                    not per-transaction fees

  Trust in automated risk scoring   Always show the underlying factors
  for defaulters                    (days overdue, history) alongside the
                                    score, and let admins override
                                    manually
  ——————————— ————————————-

## 11. Mapping to Evaluation Criteria

  ———————-- ———————————————--
  **Criterion**           **How this PRD addresses it**

  Innovation & Impact     Reframes fee management as a reconciliation
                          problem; offline-first cash capture and
                          risk-prioritized defaulter queue are not
                          standard in existing school ERPs

  Technical Execution     Modular backend services, versioned fee-rule
                          engine, event-sourced ledger, Riverpod-based
                          async state handling on mobile

  UI/UX Design            Dashboard designed as a decision surface with
                          contextual quick actions; see companion Design
                          Doc for detailed visual and interaction system
  ———————-- ———————————————--
