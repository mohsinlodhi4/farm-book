## Product Requirements and Implementation Brief

**Document type:** Product requirements + implementation plan  
**Audience:** , software developers, and farm owners evaluating a pilot  
**Initial market:** Small and medium-sized animal, dairy, and poultry farms in Pakistan  
**Primary goal:** Reduce manual calculations, scattered registers, forgotten records, stock discrepancies, and uncertainty about farm profitability.

---

## 1. Product vision

Build a simple, mobile-friendly Farm Management System that helps an owner answer, without manually combining registers:

- How many animals or birds do I currently own, by type and status?
- What did I buy, sell, lose, or transfer this month?
- How much milk, eggs, or other farm product did we produce today?
- How much product was sold, at what rate, and how much money is still owed?
- How much feed, medicine, and other stock is available?
- How much did we spend and earn, and what is the estimated operating profit?
- How much does each employee need to be paid, after attendance and advances?
- Which records need attention today?

The application should be configurable rather than hard-coded for one species. A dairy farm may track individual cows or buffaloes and milk sessions; a poultry farm may track flocks/batches, eggs, mortality, and feed. The financial, purchase, sales, inventory, and payroll foundations should be shared.

### Product principles

1. **Fast daily entry:** common transactions should take seconds, not require accounting expertise.
2. **One source of truth:** a confirmed purchase, sale, stock movement, or payment updates the relevant balances automatically.
3. **Explainable calculations:** show how every total was calculated and allow users to open its source records.
4. **Works on phones:** responsive UI, large controls, minimal typing, and usable forms for farm staff.
5. **Local-first conventions:** PKR as the default currency; configurable units including litre, kg, piece, tray, bag, maund, and animal/head.
6. **Simple by default:** no need for a farmer to understand accounting terminology to record daily work.
7. **Configurable:** farm type, animal/product types, units, wage schedules, payment methods, and production sessions are settings.
8. **Safe records:** edits and reversals must not silently corrupt historical stock or financial totals.

---

## 2. Target users and permissions

### Roles

- **Owner/Admin:** full access, settings, reports, users, and corrections.
- **Farm Manager:** daily operations, purchases, sales, stock, attendance, and operational reports.
- **Worker/Operator:** limited access to assigned tasks such as milk entry, egg collection, or attendance.
- **Accountant (optional):** sales, purchases, payments, expenses, payroll, and financial reports.
- **Veterinarian (optional/future):** animal health and treatment records.

Use role-based permissions. Workers should not see profit, payroll for other employees, or sensitive financial data unless authorized. Each farm's data must be isolated from every other farm.

---

## 3. MVP scope: build these first

The first sellable release should include:

1. Farm setup and configurable types/units.
2. Livestock register and animal purchase/sale records.
3. Product catalog and daily production entries.
4. Sales, customer balances, receipts, and outstanding dues.
5. Supplier purchases and purchase payments.
6. Feed/supplies inventory and stock movement.
7. Income, expenses, and a practical profit summary.
8. Employee register, attendance, advances, and basic payroll.
9. Dashboard, date-filtered reports, PDF/CSV export.
10. Audit history, backups, and access control.

Breeding, veterinary schedules, detailed feed rations, advanced accounting, partner settlements, integrations, and AI recommendations should be added after validating the MVP with real farms.

---

## 4. Functional modules

## 4.1 Farm setup and configuration

Store:

- Farm name, address, contact details, logo (optional), timezone.
- Currency (default PKR).
- Preferred language (English initially; Urdu/Roman Urdu support can follow).
- Farm category: dairy, cattle/livestock trading, poultry, mixed, or other.
- Units and conversions: litre, ml, kg, gram, piece, tray, crate, bag, bale, maund, head/animal.
- Animal species, breeds, groups, sheds, and status values.
- Product categories and units.
- Payment methods: cash, bank transfer, cheque, mobile wallet, credit/other.
- Production sessions, such as morning/evening milk, or egg collection shifts.
- Payroll period and default wage settings.

Do not assume every farm uses the same local unit conversions. Allow an administrator to configure and review conversions. Store a normalized base quantity plus the original entered quantity/unit where practical.

## 4.2 Livestock register

Support two tracking modes:

- **Individual animal:** cattle, buffalo, goats, sheep, horses, or high-value animals with unique records.
- **Batch/flock:** poultry and other operations where recording each bird individually is impractical.

### Individual animal fields

- Unique internal ID and optional ear tag/barcode.
- Species, breed, sex, date of birth or estimated age.
- Purchase date, supplier/seller, purchase price, and initial costs.
- Current location/shed/group.
- Purpose: dairy, breeding, meat, sale/trading, or other.
- Status: active, sold, deceased, transferred, dry, growing, or other configurable status.
- Weight history (optional MVP).
- Notes and photo (optional).
- Links to production, health, breeding, purchase, and sale records.

### Batch/flock fields

- Batch/flock ID, species/type, breed/strain, source, arrival date.
- Initial count, current count, age/stage, shed.
- Purchase cost and notes.
- Count changes from sales, mortality, transfers, or adjustments.

### Required actions

- Add, edit, search, filter, and archive records.
- Record an animal or batch purchase.
- Record sale, death/mortality, transfer, or correction with a reason.
- Show a timeline of significant events.
- Import existing animals/batches from CSV.
- Prevent accidental duplicate tag IDs within a farm.

**Core rule:** animal/batch count changes must be created through traceable events. Do not allow an unlogged edit to silently change stock history.

## 4.3 Product catalog

The farm owner can create products and decide how each product is measured and stocked.

Examples:

- Milk: cow milk, buffalo milk.
- Eggs: table eggs, trays of eggs.
- Meat: beef, mutton, poultry meat.
- Live animals.
- Manure, wool, or other by-products.
- Farm-specific products.

Fields:

- Product name, category, unit, optional SKU.
- Sales unit and conversion (e.g. tray = configured number of eggs).
- Default sale rate (optional).
- Whether production is tracked.
- Whether stock is tracked.
- Active/inactive status.

Do not force every product through the same production workflow. Milk can be entered in litres; eggs in pieces or trays; meat by weight; live animals by head.

## 4.4 Production recording

### Dairy production

- Date, animal (optional if bulk tank-only tracking is chosen), session (AM/PM/custom), quantity, unit, and notes.
- Quick-entry table for multiple animals.
- Daily total and AM/PM subtotals.
- Per-animal, per-day, and date-range summaries.
- Compare today's yield with yesterday and recent averages.
- Flag missing entries or configurable unusual drops; flags are informational, not diagnoses.

Allow a farm to choose either:
1. **Per-animal mode** for farms that measure each animal, or
2. **Bulk production mode** for farms that only measure total milk.

Avoid counting both individual yield and a bulk total as separate production.

### Poultry / egg production

- Date, flock/batch, collection session, good eggs, broken/damaged eggs, rejected eggs, and notes.
- Calculate total collected and saleable eggs.
- Convert pieces to trays using the farm's configured conversion.
- Track flock mortality and remaining bird count separately.

### Other products

Provide a generic production entry: date, product, source animal/batch (optional), quantity, unit, rejected/wasted quantity, and notes.

**Important:** production is not automatically a sale. Record production first, then record sales/dispatches separately. If product stock is enabled, production increases stock and a sale reduces it.

## 4.5 Sales and customer ledger

Support sales of milk, eggs, meat, live animals, and configurable products.

### Sales record

- Auto-generated sale/invoice number.
- Date/time, customer, product lines, quantity, unit, unit rate, discount, and line total.
- Optional delivery/dispatch quantity, transport cost, and notes.
- Payment terms: paid, partial, or credit.
- Amount paid, payment method, due date, and outstanding balance.
- Status: draft, confirmed, partially paid, paid, cancelled/reversed.

### Automatic calculations

- Line total = quantity × unit rate, after applicable discount.
- Invoice total = sum of line totals plus/minus configured charges/discounts.
- Outstanding = invoice total − payments allocated to that invoice.
- Update product stock when the sale is confirmed, where stock tracking is enabled.
- Update animal/batch count when a live-animal sale is confirmed.
- Create a customer receivable only when a sale is on credit or partially unpaid.

### Customer ledger

- Customer name, phone, address (optional), notes.
- Opening balance.
- Sales, payments received, refunds/credit notes, current balance.
- Customer statement by date range.
- Outstanding invoices and overdue amounts.
- Record one payment against one or more invoices; preserve the allocation.

Do not treat a sale invoice and receipt of cash as the same event. This is essential for partial payments and credit sales.

## 4.6 Purchases and supplier ledger

Use purchases for animals, feed, medicine, packaging, equipment, and other supplies.

### Purchase record

- Purchase number, date, supplier, items, quantities, units, unit costs, discounts, transport/other costs.
- Payment terms, amount paid, payment method, due date, notes, attachment/photo of receipt (optional).
- Status: draft, confirmed, partially paid, paid, cancelled/reversed.

### Behaviour

- Confirmed stock-item purchases increase inventory.
- Animal purchases create or increase an animal/batch record and record acquisition cost.
- Expenses that are immediately consumed can be posted as expenses instead of stock, based on user choice.
- Partial supplier payments reduce the supplier payable.
- Supplier ledger shows bills, payments, and remaining dues.
- Support opening supplier balances.

Avoid double-counting: a feed purchase increases stock; consuming that feed later records its usage/cost. Do not also post the full purchase as an immediate expense if the accounting method treats it as inventory.

## 4.7 Inventory and feed/supplies

Track:

- Feed and ingredients.
- Medicines and veterinary supplies.
- Poultry supplies, packaging, cleaning materials, and other stock.
- Semen/breeding supplies if enabled.
- Optional saleable product stock.

### Inventory functions

- Item, category, base unit, reorder threshold, current quantity.
- Stock receipts from purchases.
- Consumption/issue, wastage, expiry, return, transfer, and adjustment.
- Optional destination: shed, flock, animal, or department.
- Average purchase cost and stock value (if enabled).
- Low-stock and expiry alerts.
- Stock movement ledger with source reference and user.
- Physical stock count and adjustment reason.

### Feed consumption

MVP: record date, feed item, quantity, unit, optional shed/group/batch, and notes. Calculate the cost using the selected inventory costing method.

Future: feed recipes/rations, scheduled feeding, cost per animal, and cost per litre of milk.

### Inventory rules

- Never allow negative stock by default. If an owner permits it, show a warning and audit the override.
- All stock changes must have a movement record.
- Reversals should create compensating movements rather than erase history.
- Expiry and batch/lot tracking can be optional initially, but should be supported in the data model if medicine stock is a target use case.

## 4.8 Expenses, income, and profitability

Provide a plain-language money register for non-invoice transactions.

Expense categories might include:

- Feed consumed (if not derived from stock consumption).
- Veterinary treatment and medicine expense.
- Utilities, fuel, transport, repairs, rent, and supplies.
- Wages and bonuses.
- Other configurable costs.

Income categories might include non-invoice income, manure/by-product income, or other receipts. Avoid recording the same sale both as sales income and a separate income entry.

### Money record fields

- Date, income/expense, category, amount, payment method/account, counterparty (optional), description, attachment (optional).
- Link to purchase, sale, payroll, inventory movement, or animal where relevant.

### Reports

- Daily/monthly income and expense totals.
- Sales by product/customer.
- Purchase totals by supplier/category.
- Outstanding customer receivables and supplier payables.
- Cash in/out summary based on recorded payments.
- Operating profit estimate: recognized income minus recognized expenses for the selected period.
- Cost categories and trends.

**Accounting caveat:** cash flow, unpaid invoices, inventory purchases, and accounting profit are different views. Label the first release's P&L as an **estimated operating summary** unless a consistent accrual/inventory accounting policy is implemented. Do not present cash received minus cash paid as formal profit.

## 4.9 Minimal employee management and payroll

The purpose is to calculate and document wages, not build a full HR suite.

### Employee record

- Employee ID, name, phone (optional), job/role, start date, active/inactive status.
- Wage method: daily, monthly, hourly, or piece-rate (optional).
- Base rate, normal pay period, and notes.
- Optional emergency contact; restrict access to personal information.

### Attendance

- Date, employee, present/absent/half-day or hours worked.
- Optional overtime hours and approved rate.
- Fast bulk attendance entry for the whole team.
- Record who entered/edited attendance.

### Advances and deductions

- Cash advance date, amount, and outstanding balance.
- Repayment/deduction linked to a payroll run.
- Optional other authorized deductions and bonuses, each with a reason.
- Do not permit a deduction to exceed the unpaid advance balance.

### Payroll run

- Select pay period and employees.
- Calculate gross wages using the configured wage method.
- Add approved overtime/bonus.
- Subtract advances/authorized deductions.
- Show gross, deductions, net payable, amount paid, and balance due.
- Mark payment with date and method.
- Generate a printable payroll sheet/receipt.
- Lock a finalized payroll run; corrections should use a reversal/adjustment.

For monthly fixed salaries, attendance should not automatically change pay unless the farm configures that rule. Payroll formulas must be visible and configurable. This is an operational tool, not a claim of legal payroll compliance; local labour/tax rules should be reviewed separately.

## 4.10 Dashboard and alerts

The dashboard should answer “What happened?” and “What needs attention?”

Show:

- Current animals/birds by type and status.
- Today's production by product and session.
- Today's sales, cash collected, and credit sales.
- Outstanding customer dues.
- Purchases and supplier dues.
- Low-stock items and near-expiry stock.
- Today's attendance and upcoming payroll.
- Recent expenses and estimated period performance.
- Upcoming tasks and reminders, if enabled.

Alerts should be actionable, dismissible, and traceable to a record. Examples: stock below threshold, unpaid invoice overdue, missing milk entry, upcoming vaccination, or expected calving (future module).

## 4.11 Reports and export

All reports should support date range, farm/shed/group, product/animal type, and relevant status filters.

MVP reports:

1. Livestock opening/current count and movement history.
2. Animal purchase and sale register, with per-animal purchase/sale margin where costs are available.
3. Daily and monthly milk production.
4. Egg production, damaged eggs, and mortality (when poultry features are enabled).
5. Product sales and sales totals.
6. Customer balances and overdue invoices.
7. Purchases and supplier balances.
8. Inventory on hand and stock movement.
9. Expense category summary.
10. Income and estimated operating summary.
11. Employee attendance, advances, and payroll.
12. Daily closing summary.

Support CSV export for analysis and PDF/print for sharing. Exported reports must use the selected filters and display the date range, currency, and unit.

---

## 5. Future modules (not required for first release)

Build these only after interviewing farm owners and validating demand.

### Animal health and veterinary records
- Disease/condition, symptoms/notes, vet, treatment, medicine, dose as entered by the authorized user, date, follow-up, cost.
- Vaccination and deworming schedules/reminders.
- Treatment withdrawal period tracking for milk/meat where relevant.
- Prominent “do not sell/use before” warnings based on entered treatment data.
- This module is a recordkeeping aid, not a veterinary diagnosis tool.

### Breeding and lifecycle
- Heat observation, natural service/artificial insemination, sire/semen details.
- Pregnancy check, expected calving date, actual calving outcome.
- Calf creation and linkage to mother.
- Lactation number, dry-off date, days in milk.
- Reminders and reproductive history.

### Weight and growth
- Dated weight records, growth charts, purchase/sale weights.
- Cost and value by animal/batch.

### Multi-farm and partner settlement
- Multiple farms/sheds under one owner.
- Partner contributions, ownership shares, expenses paid by each partner, distributions, settlement statement.
- Keep this distinct from customer/supplier ledgers.

### Advanced accounting
- Double-entry ledger, chart of accounts, journal entries, trial balance, balance sheet.
- Inventory valuation policy, cost of goods sold, depreciation, bank reconciliation.
- Implement only with explicit accounting requirements and test coverage.

### Automation and integrations
- WhatsApp/SMS reminders, messaging integration, barcode/QR animal tags, weighing scales, milk meters, accounting exports.
- Offline-first PWA with safe synchronization.
- AI/Urdu/Roman Urdu question answering over authorized farm data, e.g. “How much milk did we sell this week?” Only after reliable structured data and access controls exist.

---

## 6. Core data model

Use relational records with stable IDs, timestamps, farm ownership, and explicit relationships. Suggested initial entities:

- `Farm`
- `User`, `FarmMembership`, `Role` / permissions
- `AnimalType`, `Breed`, `Location` (shed/group)
- `Animal`
- `AnimalBatch`
- `AnimalEvent` (purchase, sale, death, transfer, count adjustment)
- `Product`, `Unit`, `UnitConversion`
- `ProductionEntry`
- `Customer`, `Supplier`
- `Sale`, `SaleLine`, `CustomerPayment`, `PaymentAllocation`
- `Purchase`, `PurchaseLine`, `SupplierPayment`
- `InventoryItem`, `StockMovement`, `StockLot` (optional)
- `Expense`, `OtherIncome`
- `Employee`, `AttendanceEntry`, `EmployeeAdvance`
- `PayrollRun`, `PayrollLine`, `PayrollPayment`
- `Reminder` (future or basic MVP)
- `Attachment` (optional)
- `AuditLog`

### Shared fields

Where appropriate, records should include:

- `id` (UUID or equivalent)
- `farm_id`
- `created_at`, `updated_at`
- `created_by`, `updated_by`
- `status`
- optional `notes`

Use database constraints and transactions for operations that affect multiple records. Monetary values should use fixed-precision decimal types, not binary floating-point. Quantities and unit conversions should use suitable decimal precision. Store dates/times consistently and display them in the farm's configured timezone.

### Data integrity rules

- Each farm's data is isolated at the API and database levels.
- Use soft deletion only where appropriate; preserve financial/stock history.
- Confirmed transactions are immutable in effect: corrections use cancellation/reversal or adjustment records.
- A payment may be allocated across multiple invoices, and an invoice may receive multiple payments.
- Never infer “paid” solely from an invoice status when payment records are available.
- Stock balance should be reconcilable from stock movements.
- Animal/batch count should be reconcilable from events.
- Financial dashboard totals must be derived from source records, not manually maintained duplicate totals.
- Use idempotency or duplicate-submit protection for important transaction endpoints.

---

## 7. Calculation rules to implement and test

1. **Sale line amount:** quantity × unit rate, less line discount.
2. **Invoice total:** sum of line amounts plus configured charges, less invoice discount.
3. **Invoice balance:** invoice total minus valid allocated payments and credits/refunds.
4. **Customer balance:** opening balance + posted charges − payments/credits, using a clearly defined sign convention.
5. **Supplier balance:** opening balance + posted purchases − supplier payments/credits.
6. **Animal count:** opening count + additions − sales − deaths − transfers out + transfers in ± authorized adjustments.
7. **Inventory on hand:** opening quantity + receipts + returns in − consumption − sales/dispatches − wastage − returns out ± adjustments.
8. **Production total:** sum of valid entries for the selected date/session/product; avoid counting both source entries and an aggregated total.
9. **Payroll gross:** formula selected for the employee's wage method, plus approved overtime/bonus.
10. **Payroll net payable:** gross − authorized deductions/advance repayment.
11. **Cash movement:** actual payments received − actual payments made, not invoice totals.
12. **Estimated operating result:** recognized income − recognized expenses, with the chosen treatment of inventory consumption and unpaid bills clearly documented.

All calculations must respect farm-specific units and configured conversions. Round currency only according to the configured currency policy; never repeatedly round intermediate values.

---

## 8. Main user workflows

### Workflow A: Buy a cow

1. Create purchase and enter supplier, date, price, and payment details.
2. Create/link the animal record and assign its tag/type.
3. Confirm purchase.
4. Animal appears in current livestock inventory.
5. Supplier balance reflects unpaid amount, if any.
6. Purchase cost is visible in the animal's history.

### Workflow B: Record and sell today's milk

1. Open “Today's Production.”
2. Enter morning/evening milk per animal or total bulk milk.
3. Save and view calculated total.
4. Create a sale for customer, quantity, rate, and payment terms.
5. Confirm dispatch/sale.
6. Product stock reduces if enabled.
7. Customer balance updates for unpaid amounts.
8. Dashboard and reports update automatically.

### Workflow C: Buy feed and record usage

1. Record feed purchase and payment/credit terms.
2. Confirm purchase; feed stock increases.
3. Record feed issued/consumed by date and optionally shed/group.
4. Stock decreases and movement history records the usage.
5. Stock alert appears when quantity reaches the reorder threshold.
6. Financial reporting avoids counting the same cost twice.

### Workflow D: Pay a worker

1. Add employee and wage method.
2. Mark attendance in bulk during the pay period.
3. Record any advances and bonuses.
4. Create payroll run for the period.
5. Review formula, attendance, deductions, and net payable.
6. Finalize and record actual payment.
7. Print/export the payroll sheet; payroll cost appears in the appropriate financial report.

### Workflow E: Close the day

Show a simple daily summary with production, sales, money collected, credit outstanding, purchases, expenses, mortality/count changes, stock warnings, and missing entries. Totals must link to their source records.

---

## 9. UX requirements

- Mobile-first responsive interface.
- Main navigation: Dashboard, Livestock, Production, Sales, Purchases, Inventory, Expenses, Employees/Payroll, Reports, Settings.
- Common actions available from the dashboard: Add animal, Record production, New sale, New purchase, Record expense, Mark attendance.
- Use familiar language; avoid forcing accounting jargon on workers.
- Provide quick-entry tables and bulk attendance.
- Search by animal tag, customer, supplier, product, or invoice number.
- Forms should preserve entered data after validation errors.
- Show confirmation before finalizing/cancelling a transaction.
- Display empty states with a clear next action.
- Provide visible loading, success, and error states.
- Use clear date and number formatting; show currency and units.
- Ask only for data needed for the selected workflow.
- Provide printable receipts and reports.

## 10. Non-functional requirements

- Secure authentication and server-side authorization.
- Strict farm-level data isolation in every endpoint and query.
- Input validation on client and server.
- Database transactions for multi-record changes.
- Audit log for sensitive actions and finalized transaction corrections.
- Automated database backups and a documented restore process.
- Pagination/filtering for growing datasets.
- Reasonable performance on common low-cost Android phones and slower connections.
- Basic monitoring and error logging without exposing credentials or sensitive data.
- Export and backup features to reduce fear of vendor lock-in.
- Accessibility: readable text, clear contrast, keyboard support where practical.
- Privacy-conscious handling of employee/customer contact details.

Offline support is valuable for farms with unreliable connectivity, but do not claim offline capability until synchronization conflicts, duplicate submissions, and recovery have been tested.

---

## 11. Suggested implementation sequence for 

### Phase 0 — inspect the existing project
- Inspect repository, framework, package scripts, database, existing conventions, and tests before changing code.
- Summarize current architecture and propose the smallest coherent implementation plan.
- Do not replace the stack or rewrite working components without a reason.
- If the repository is empty, propose a conventional maintainable stack and ask only if a decision materially blocks progress.

### Phase 1 — foundation
- Farm setup, authentication, membership, role-based authorization.
- Shared UI layout, navigation, validation, error handling.
- Database migrations/schema and seed/demo data.
- Audit fields and test setup.

### Phase 2 — operational records
- Livestock register and animal/batch events.
- Product and unit configuration.
- Production entries and summaries.
- Purchases, suppliers, sales, customers, payments, and balances.

### Phase 3 — inventory and finance
- Inventory movements and low-stock alerts.
- Expenses and income.
- Daily/monthly reports and estimated operating summary.
- Ensure transaction reversal and no-double-counting behaviour.

### Phase 4 — payroll
- Employee records, attendance, advances, payroll calculation, payment history, printable report.

### Phase 5 — polish and pilot
- Mobile UX, CSV import/export, PDF/print reports, dashboard.
- Seed a realistic demo farm.
- Run calculation, permissions, transaction, and regression tests.
- Test with one dairy farm and one poultry or livestock farm before adding advanced features.

For each phase:
1. Read relevant code before editing.
2. Implement a coherent vertical slice.
3. Add/update automated tests.
4. Run lint, type-check, and tests available in the repository.
5. Report changed files, migrations, assumptions, test results, and known limitations.
6. Do not claim a command passed unless it was actually run.

---

## 12. Acceptance criteria

The MVP is ready for a pilot only when:

- An owner can configure the farm's types, units, and products without code changes.
- Animal purchases, sales, deaths, and transfers produce traceable current counts.
- Production can be entered in bulk and summarized by date/session/product.
- A confirmed sale updates product/animal stock correctly and tracks partial payments and outstanding balances.
- A purchase updates stock or animal records and supplier balances without double-counting expenses.
- Inventory balance can be reconstructed from movement history.
- Employee attendance, advances, and wage method produce a transparent payroll calculation.
- Dashboard totals agree with their underlying records for the same filters.
- Farm A users cannot read or mutate Farm B data by changing request IDs or parameters.
- Repeated submissions do not accidentally create duplicate financial/stock transactions.
- Reversing a transaction restores its stock/balance effects through an auditable correction.
- Core workflows work on a mobile-sized viewport.
- Automated tests cover calculations, permissions, and key transaction paths.
- A backup can be restored using documented steps.

---

## 13. Pilot and validation plan

Before committing to advanced features, interview 3–5 farm owners or managers. Ask them to show—not just describe—their current registers.

Observe:
- How they count animals or flocks.
- How milk/eggs are recorded and sold.
- How credit sales and customer dues are remembered.
- How feed and medicine purchases/consumption are tracked.
- How workers are paid and advances are handled.
- Which calculations cause disputes or consume the most time.
- Whether mobile internet is reliable in the sheds.
- Which Urdu/English terms they actually use.

For the first pilot, import a small, verified set of opening balances. Run the software alongside existing registers for one or two weeks and compare totals daily. Do not discard the paper process until the owner trusts the reports.

### Suggested pilot success measures

- Time required to close daily records.
- Difference between physical stock and system stock.
- Difference between manually calculated and system-calculated dues/payroll.
- Percentage of daily production entries completed.
- Number of overdue balances visible and followed up.
- Owner's ability to answer “How much did we produce, sell, spend, and collect?” without combining registers.

---

## 14. Product positioning for farm owners

### Simple pitch

**“Your farm's animals, production, sales, purchases, stock, and worker payments in one simple system. Stop combining registers and recalculating totals every night. Record daily activity once and get clear balances and reports automatically.”**

### Demonstration sequence

1. Add a sample animal or flock.
2. Record today's milk or egg production.
3. Sell part of the production on credit.
4. Show remaining stock and customer dues.
5. Record a feed purchase and employee attendance.
6. Generate the daily summary and payroll sheet.

Sell the outcome—less manual work, fewer forgotten dues, clearer stock, and faster decisions—not a long list of modules. Offer customization after observing the farm's actual workflow.

---

## 15. Research references

These public product pages were reviewed for common farm-management capabilities and local operating needs. They are market references, not endorsements; verify current functionality directly with each vendor.

- [DairyFarmManager](https://www.dairyfarmmanager.com/) — milk yield, breeding, health, inventory, income/expenses, and reports.
- [Dusuq ERP](https://dusuq.com/) — dairy herd, production, health, breeding, inventory, finance, and multi-shed workflows in Pakistan.
- [MandiOye Farm Management](https://mandioye.com/farm-management) — Pakistan-oriented livestock, local units, inventory, wages, partner balances, and reports.
- [DigitalManager Dairy Farm Management](https://www.digitalmanager.pk/dairy-farm-management-software/) — purchase, sales, inventory, milk production, herd, and accounts.
- [Cowgenic](https://www.dfmscowgenic.com/) — dairy/poultry positioning, animal reports, production, staff, and finance.
- [DairyManager Pakistan](https://www.dairymanager.pk/) — milk recording, herd records, buying/selling, and livestock use cases.
- [Hulm cattle management](https://hulmsolutions.com/cattle-management-software/) — animal-level purchase/sale margin, health records, and feed inventory.
- [Khet features](https://khetq.com/features) — useful adjacent reference for farm attendance, wage calculation, advances, and produce sales workflows.

---

## Final instruction

Treat this document as the product direction, not permission to build every module at once. First inspect the existing repository, identify the current stack, and propose an MVP implementation plan. Prioritize reliable records, transparent calculations, permissions, and an easy daily workflow over visual complexity or AI features. Keep farm-specific workflows configurable and add advanced modules only after the MVP's core calculations and data integrity are tested.
