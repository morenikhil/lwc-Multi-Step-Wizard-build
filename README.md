# Multi-Step Wizard — Reusable Lightning Web Component

A stepper-driven, reusable wizard form for Salesforce built with Lightning Web
Components. It provides a progress indicator, per-step validation, back/next
navigation and a review step — while staying completely domain-agnostic. You
supply the steps and fields; the wizard handles orchestration.

![Architecture]


---

## Features

- 🧭 **Stepper progress indicator** — `base` (numbered) or `path` (chevron) style.
- ✅ **Per-step validation** — the active step is validated before advancing; any slotted input exposing `reportValidity()` is covered automatically.
- ⬅️➡️ **Back / Next navigation** — with a smart primary button that becomes *Finish* on the last step.
- 👀 **Review step** — build a data-driven summary step as the final step.
- 🔌 **Slot-based & reusable** — drop in any markup; no coupling to a specific object or field set.
- 🎛️ **Imperative API** — `next()`, `previous()`, `goToStep()`, `reset()`, `reportValidity()`.
- 📣 **Events** — `stepchange` and `complete` for consumer-side logic.

---

## Project structure

```
force-app/main/default/
├── classes/
│   ├── WizardController.cls            # @AuraEnabled createContact (demo backend)
│   └── WizardControllerTest.cls        # Apex unit tests
└── lwc/
    ├── multiStepWizard/                # ← reusable container
    ├── wizardStep/                     # ← reusable step wrapper
    └── wizardDemo/                     # example consumer (Contact creation)
```

The two reusable building blocks are **`multiStepWizard`** and **`wizardStep`**.
`wizardDemo` + `WizardController` are an example you can delete once you have
your own consumer.

---

## Quick start

```html
<!-- yourComponent.html -->
<c-multi-step-wizard
    progress-type="base"
    finish-label="Submit"
    onstepchange={handleStepChange}
    oncomplete={handleComplete}
>
    <c-wizard-step name="details" label="Details">
        <lightning-input label="Last Name" data-field="lastName" required
                         onchange={handleFieldChange}></lightning-input>
    </c-wizard-step>

    <c-wizard-step name="review" label="Review">
        <p>Name: {fullName}</p>
    </c-wizard-step>
</c-multi-step-wizard>
```

```js
// yourComponent.js
handleComplete() {
    // Fired when the user finishes the last step. Persist your data here.
}
```

Because content is projected through slots, **your consumer owns the form state**
(the wizard never reads your fields). Wire inputs with `onchange` handlers as you
normally would.

---

## API reference — `c-multi-step-wizard`

### Attributes

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `progress-type` | string | `base` | Progress indicator style: `base` or `path`. |
| `hide-progress-indicator` | boolean | `false` | Hide the progress indicator. |
| `hide-footer` | boolean | `false` | Hide the built-in nav footer (drive with the API instead). |
| `allow-step-navigation` | boolean | `false` | Allow clicking a *visited* step to jump back. |
| `previous-label` | string | `Previous` | Label for the back button. |
| `next-label` | string | `Next` | Label for the next button. |
| `finish-label` | string | `Submit` | Label for the primary button on the last step. |

### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `next()` | boolean | Validates the active step, then advances (or fires `complete` on the last step). |
| `previous()` | boolean | Moves back one step (no validation). |
| `goToStep(name)` | boolean | Jumps to a named step; forward jumps validate first. |
| `reset()` | void | Returns to the first step and clears visited history. |
| `reportValidity()` | boolean | Re-runs validation for the active step. |

### Events

| Event | `detail` | Fired when |
| --- | --- | --- |
| `stepchange` | `{ previousStep, currentStep, currentIndex, direction }` | The active step changes. |
| `complete` | `{ stepName, stepIndex }` | The user finishes the last step. |

## API reference — `c-wizard-step`

| Attribute | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | ✅ | Unique key used for navigation & the indicator value. |
| `label` | string | ✅ | Label shown in the progress indicator. |

Default slot: the step's content. Any element inside that exposes a
`reportValidity()` method (e.g. `lightning-input`, `lightning-combobox`) is
validated automatically when leaving the step.

---

## How it works

1. Each `c-wizard-step` fires a **composed, bubbling** `wizardstepregister`
   event on connect, passing `{ name, label, setActive, reportValidity }`.
2. The container collects steps in DOM order and activates the first one.
3. On **Next**, the container calls the active step's `reportValidity()`. If it
   returns `false`, navigation is blocked and errors surface inline.
4. On the last step, **Next** becomes the *finish* button and fires `complete`.

This is the same decoupled pattern used by `lightning-tabset`/`lightning-tab`:
the container drives children through callbacks it received at registration,
never by reaching into their DOM. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Deploy

Requires the [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli).

```bash
# Authorize an org
sf org login web --alias myOrg

# Deploy the metadata
sf project deploy start --source-dir force-app --target-org myOrg

# (Optional) assign yourself access and open the org
sf org open --target-org myOrg
```

Add the **Wizard Demo** component to any App/Home/Record page via the Lightning
App Builder to see it in action. To reuse only the wizard, deploy the
`multiStepWizard` and `wizardStep` bundles and reference them from your own LWC.

---

## Best practices applied

- **Separation of concerns** — presentational wizard vs. consumer-owned data vs. thin Apex.
- **Reusability first** — slots + a public API, no hard-coded fields or objects.
- **Security** — `with sharing`, CRUD checks (`isCreateable`), and `AuraHandledException` for safe error messaging.
- **Accessibility** — SLDS markup, `role="tabpanel"`, native `lightning-input` validation.
- **Governor-friendly** — a single DML insert; no queries in loops.
- **Testability** — imperative API and event contract make both layers unit-testable.
- **Tooling** — ESLint (`@salesforce/eslint-config-lwc`), Prettier, and `sfdx-lwc-jest` configured.
