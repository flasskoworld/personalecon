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
- [x] Income update field for raises/new jobs (implemented as full income management section in Overview tab)
- [ ] Multi-currency support (free feature — allow users to pick currency symbol during onboarding or in settings)

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
- [x] Gate Projected debt-free date behind Pro
- [x] Gate Monthly cash flow breakdown behind Pro
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
- [x] Fix PELanding mobile layout (hero text overflow, feature cards, stats grid, footer)
- [x] Fix PEDashboard mobile layout (header nav, tabs overflow, KPI grid, debt cards, charts, payment inputs)
- [x] Fix PEOnboarding mobile layout (step forms, input fields, navigation buttons)
- [x] Fix PEPricing mobile layout (pricing cards, feature list, CTA)

## App Title Rename
- [ ] Rename app title in VITE_APP_TITLE secret (manual step: Settings → Secrets → VITE_APP_TITLE → "Personal Economy")
- [x] Update client/index.html <title> tag (already says "Personal Economy")
- [x] Update hardcoded references in code files (Home.tsx badge updated)

## Smart Home-Screen Routing
- [x] Detect if user has a saved personal plan (non-demo, onboarding complete) in localStorage
- [x] If plan exists: redirect / to /pro/dashboard automatically
- [x] If no plan: show landing page as normal
- [x] Handle the case where user is on /pro/* routes and has no plan (redirect to onboarding via PEDashboard guard)
- [x] Ensure demo mode does NOT trigger the auto-redirect (isDemo check in hasPersonalPlan)

## App Title & Post-Payment Pro Flow
- [x] App title: index.html already says "Personal Economy"; login screen title is platform-managed (VITE_APP_TITLE is a built-in system secret, not editable from Secrets UI)
- [x] Audit post-Stripe-payment success flow: success_url correctly points to /pro/dashboard?upgraded=true
- [x] Ensure Pro status is unlocked immediately: useProStatus now runs checkAndPersistUpgradeParam() at module-load time (before any React render)
- [x] Post-payment redirect goes to /pro/dashboard (Stripe success_url confirmed)
- [x] Pro features active on dashboard after payment: isPro initialised from localStorage synchronously so features unlock on first render after redirect

## Income Management
- [x] Add additionalIncome array to AppState (id, label, amount, frequency)
- [x] Update computed monthlyIncome to include additional income sources
- [x] Add updatePrimaryIncome action to store
- [x] Add addAdditionalIncome / removeAdditionalIncome actions to store
- [x] Build Income section in dashboard Overview tab (edit primary + add/remove extra sources)
- [x] Show total combined income in KPI strip (shown inline in Income card when additional sources exist)

## Free Tier Alignment
- [x] Remove Pro gate from Savings & Investments tab (make fully free)
- [x] Remove isPro flag from Savings & Investments tab navigation item
- [x] Keep Game Plan tab Pro-gated
- [x] Keep debt editing Pro-only
- [x] Keep payment logging Pro-only
- [x] Enforce 3-debt limit for free users (hide debts beyond index 3, show upsell banner)
- [x] Show Pro upsell banner after 3rd debt card for free users
- [x] Keep Avalanche strategy Pro-only
- [x] Keep projected debt-free date Pro-only
- [x] Update FREE_FEATURES list on pricing page to accurately reflect what's free
- [x] Update PRO_FEATURES list to reflect what's actually Pro-only

## Free Tier Debt Limit - Gap Fixes
- [x] Show debts beyond index 3 with a locked/blurred overlay instead of hiding them
- [x] Block adding a 4th+ debt in onboarding for free users (show upgrade CTA)

## Bug Fixes
- [x] Fix errors when opening Savings & Investments tab in dashboard (duplicate React key when savings goal = milestone value)

## Subscription Management & Support
- [x] Audit Stripe checkout success_url and Pro unlock flow end-to-end (confirmed correct)
- [x] Add cancel subscription button/flow for Pro users (footer button + confirmation modal)
- [x] Add contact support link (streetecon@proton.me) in dashboard footer
- [x] Ensure cancel subscription clears Pro status locally and shows downgrade message (deactivatePro + toast)

## One-Click Billing Cancellation (Server-Side)
- [x] Add stripeCustomerId and stripeSubscriptionId columns to users table in drizzle schema
- [x] Run pnpm db:push to migrate the schema
- [x] Update Stripe checkout to create/retrieve Stripe customer and store customer ID on user record
- [x] Update webhook to store subscriptionId and sync Pro status server-side on checkout.session.completed
- [x] Add tRPC procedure: stripe.cancelSubscription (calls Stripe API to cancel, clears subscription ID)
- [x] Add tRPC procedure: stripe.getPortalUrl (creates Stripe Customer Portal session, returns URL)
- [x] Add tRPC procedure: stripe.getSubscriptionStatus (returns current Pro status from DB)
- [x] Update dashboard Cancel Subscription button to call server-side cancel instead of just clearing localStorage
- [x] Update Pro status check to also verify against server-side subscription status for authenticated users
- [x] Write vitest tests for the new stripe procedures (12 tests passing: stripeProducts config, getSubscriptionStatus logic, cancelSubscription logic, webhook handler logic)

## Stripe Payment Flow Bug Fixes
- [x] Fix success_url: pass origin from frontend input.returnUrl instead of relying on ctx.req.headers.origin (server-side origin is wrong in production)
- [x] Fix Pro unlock on return: created dedicated /pro/success page as Stripe success_url — activates Pro immediately before any routing guards run
- [x] Add payment success confirmation toast/banner when user returns from Stripe with ?upgraded=true — /pro/success page shows full confirmation screen
- [x] Fix cancel subscription visibility: getSubscriptionStatus now runs for all authenticated users (not just when isPro is set)
- [x] Add a dedicated /pro/success page as the Stripe success_url to reliably handle Pro activation before routing to dashboard

## Make App Fully Free (Remove All Pro Gating)
- [x] Remove effectivelyPro/isPro checks from PEDashboard — set all features as always unlocked
- [x] Remove ProGate wrapper components and ProBadge lock icons from all tabs
- [x] Remove "FREE → Upgrade" button from header, replace with plain app branding
- [x] Remove "Cancel Subscription" and billing-related footer links
- [x] Remove Stripe checkout mutation from PEPricing / remove pricing page from routing
- [x] Remove /pro/success page from routing
- [x] Remove Stripe-related tRPC calls from PEDashboard (cancelSubscription, getPortalUrl, getSubscriptionStatus)
- [x] Update PELanding to remove pricing/upgrade CTAs (was already clean)
- [x] Remove useProStatus hook usage from dashboard (hook file kept but no longer imported in dashboard)

## In-Dashboard Flexibility & Personalized Game Plan
- [x] Add "Add Debt" button in Debt Tracker tab that opens an inline add-debt form (name, balance, APR, minimum payment, color)
- [x] Add "Add Expense" button in Budget tab that opens an inline add-expense form (label, amount, essential toggle)
- [x] Add "Remove Expense" button on each expense row in Budget tab
- [x] Make Game Plan tab fully personalized: generate ranked action steps, priority warnings, and month-by-month milestones based on user's actual income, debts, expenses, savings, and strategy
- [x] Game Plan: show a personalized "Your #1 Move Right Now" hero card based on worst financial signal (high APR debt, negative cashflow, no savings buffer, etc.) — shown as CRITICAL/DO FIRST badge on top priority step
- [x] Game Plan: show dynamic monthly allocation recommendation (how much to savings vs debt vs buffer) based on actual leftover — shown in savings automation step

## Game Plan Additions
- [x] Re-add "The 3 Rules" section to Game Plan tab (pay yourself first, attack highest APR, found money goes to plan)
- [x] Re-add "Quick Wins Right Now" section to Game Plan tab (dynamic, based on user's actual data)

## Pre-Launch Sweep Fixes
- [x] Fix: Replace window.prompt() for expense editing with the AddExpenseModal (bad UX, breaks on mobile Safari)
- [x] Fix: Budget tab pie chart renders empty when expenses array is empty — add empty state guard
- [x] Fix: NotFound (404) page uses light theme (white/slate-50) — restyle to match the dark brand
- [x] Fix: Remove /personal route and Home.tsx dead-end (old Hustle Board — unreachable from UI but still accessible by URL)
- [x] Fix: Onboarding has no escape route — add a subtle "← Back to home" link in the top bar so users aren't trapped

## Light/Dark Mode
- [x] Add light mode CSS variables to index.css (.light class with inverted palette)
- [x] Add theme toggle button (sun/moon icon) to dashboard header and landing page nav
- [x] Persist theme preference to localStorage so it survives page refresh (ThemeContext already handles this)
- [x] Ensure all custom inline styles and hardcoded colors respect the active theme (CSS variables applied to structural elements)

## Account-Based Cloud Sync
- [x] Add user_plans table to drizzle schema (userId, planData JSON, clientUpdatedAt)
- [x] Add DB helpers: savePlan (last-write-wins by clientUpdatedAt), loadPlan
- [x] Add tRPC procedures: plan.save (authed, saves full state JSON), plan.load (authed, returns latest plan)
- [x] Frontend: on login, load cloud plan and merge with local (cloud wins if newer clientUpdatedAt)
- [x] Frontend: auto-save to cloud on every state change (debounced 3s) when user is authenticated
- [x] Show sync status indicator in dashboard header (syncing... pulse shown when save is in progress)
- [x] Show "Sign in to sync across devices" prompt in dashboard footer for unauthenticated users (footer note updated)

## Savings Goal Shortcut
- [x] Add "Update Savings Goal" button/modal to savings tab (set new goal amount, shows celebration if goal was reached)
- [x] Allow adding a second/new goal when the current one is reached (modal shows "New Savings Goal" title with celebration message)
- [x] Show goal completion celebration when savings >= goal (modal title changes to "🎉 New Savings Goal" with congratulatory message)
