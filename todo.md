# Personal Economy — Project TODO

## Personal Dashboard (Home — /  )
- [x] Dark Hustle Board / Personal Economy theme
- [x] Hero with income, KPI cards (debt, paid, savings, interest)
- [x] Live date bar (clock, payday countdown, month progress)
- [x] Overview tab with snowball vs. avalanche comparison
- [x] Debt Tracker tab with APR, interest costs, strategy toggle
- [x] Debt edit modal (update balance, APR, paid, minimum, name)
- [x] Budget tab with pie chart, essential/non-essential breakdown
- [x] Savings tab with milestones and projection chart
- [x] Game Plan tab with month-by-month roadmap
- [x] Reset all data button
- [x] Rename title to "Personal Economy" with £ badge

## Personal Economy Pro Product (/pro/*)
- [x] Landing page with hero, features, how-it-works, CTA
- [x] Sample demo data (Jordan Rivers, $5,417/mo, $10,070 debt)
- [x] View Demo button loads sample data and navigates to dashboard
- [x] 5-step onboarding wizard (income, expenses, debts, savings, investments)
- [x] Full dynamic dashboard with all 5 tabs driven by user data
- [x] Savings & Investments tab with portfolio tracker
- [x] Snowball / Avalanche strategy toggle
- [x] Debt edit modal in Pro dashboard
- [x] Reset anytime with confirmation modal
- [x] Pricing page with Free and Pro tiers
- [x] Monthly / Yearly billing toggle (save 33%)
- [x] Stripe checkout session creation via tRPC
- [x] FAQ section on pricing page
- [x] Full-stack upgrade (db, server, user, Stripe)
- [x] All TypeScript errors resolved
- [x] Vitest tests passing (5/5)

## Future Enhancements
- [ ] PDF export of full financial plan
- [ ] Payday banner/modal reminder on payday
- [ ] Monthly check-in log with notes
- [ ] Income update field for raises/new jobs
- [ ] Multi-currency support in Pro

## Footer Branding
- [x] Upload StreetEconomics logo to static assets
- [x] Add "Powered By: StreetEconomics" footer with logo and link to PELanding, PEDashboard, PEOnboarding, PEPricing

## Paywall / Free vs. Pro Feature Gating
- [x] Create useProStatus hook (reads isPro from localStorage after Stripe payment)
- [x] Create ProGate component (lock overlay with upgrade CTA)
- [x] Gate Avalanche strategy toggle + comparison behind Pro
- [x] Gate Game Plan tab behind Pro (show lock on tab)
- [x] Gate Investment Portfolio tab behind Pro
- [x] Gate Debt edit modal behind Pro
- [x] Gate payment logging (Log Payment button) behind Pro
- [ ] Gate Projected debt-free date behind Pro
- [ ] Gate Monthly cash flow breakdown behind Pro
- [x] Wire upgrade CTA to /pro/pricing Stripe checkout
- [x] Show "Free Plan" vs "Pro" badge in dashboard header

## Demo Mode — Start Your Own Plan CTA
- [x] Add persistent sticky banner/button in demo dashboard to navigate to onboarding
- [x] Banner should only show in demo mode (state.isDemo)
- [x] Clicking navigates to /pro/onboarding and resets demo state

## Demo Mode Paywall Bypass
- [x] In demo mode, bypass all Pro gates so all features are fully previewable
- [x] In personal plan mode (non-demo), keep Pro locks and upgrade prompts
- [x] Update tab click handlers to check isDemo flag
- [x] Update ProBadge on tabs to not show in demo mode

## Mobile Optimization
- [ ] Fix PELanding mobile layout (hero text overflow, feature cards, stats grid, footer)
- [ ] Fix PEDashboard mobile layout (header nav, tabs overflow, KPI grid, debt cards, charts, payment inputs)
- [ ] Fix PEOnboarding mobile layout (step forms, input fields, navigation buttons)
- [ ] Fix PEPricing mobile layout (pricing cards, feature list, CTA)
