# Architecture — Multi-Step Wizard

A rendered diagram is available at [architecture.svg](architecture.svg). The
Mermaid sources below are the maintainable version of the same picture.

## 1. Component composition

```mermaid
flowchart TD
    subgraph Consumer["Consumer component (c-wizard-demo)"]
        direction TB
        state["Form state + handlers<br/>oncomplete / onstepchange"]
        subgraph Wizard["c-multi-step-wizard (container)"]
            direction TB
            progress["lightning-progress-indicator"]
            slot["&lt;slot&gt; (active step only)"]
            footer["Footer: Previous / Next / Finish"]
            step1["c-wizard-step name=details"]
            step2["c-wizard-step name=address"]
            step3["c-wizard-step name=preferences"]
            step4["c-wizard-step name=review"]
            slot --- step1
            slot --- step2
            slot --- step3
            slot --- step4
        end
        state --> Wizard
    end
    Wizard -->|createContact payload| apex["Apex WizardController"]
    apex --> db[("Contact record")]
```

## 2. Registration & control handshake

The container never queries the DOM of its steps. Instead each step registers
itself, handing the container a pair of callbacks — the same pattern
`lightning-tabset` / `lightning-tab` use.

```mermaid
sequenceDiagram
    participant Step as c-wizard-step
    participant Wizard as c-multi-step-wizard
    Note over Step: connectedCallback()
    Step->>Wizard: wizardstepregister (composed, bubbles)<br/>detail: {name, label, setActive, reportValidity}
    Wizard->>Wizard: store step, activate first
    Wizard->>Step: setActive(true|false)
    Note over Step: disconnectedCallback()
    Step->>Wizard: wizardstepderegister {name}
```

## 3. Navigation & validation flow

```mermaid
flowchart LR
    A["User clicks Next"] --> B{"activeStep.reportValidity()"}
    B -->|invalid| C["Show field errors<br/>set hasError, stay"]
    B -->|valid| D{"isLastStep?"}
    D -->|no| E["activate next step<br/>fire stepchange"]
    D -->|yes| F["fire complete event"]
    F --> G["Consumer calls Apex + toast"]
```

## Design rationale

| Decision | Why |
| --- | --- |
| **Slot-based composition** | Consumers own their fields and layout; the wizard stays domain-agnostic and truly reusable. |
| **Self-registration via composed events** | Decouples container from children across the shadow boundary — no `querySelector` into slotted DOM. |
| **Callbacks in the register payload** | Lets the container drive children (`setActive`, `reportValidity`) without a pub/sub library. |
| **Validation delegated to the active step** | Each step validates its own slotted inputs generically (anything exposing `reportValidity`). |
| **Thin Apex with CRUD/FLS checks** | Keeps business logic server-side and enforces `with sharing` + object security. |
| **Public imperative API** | `next()/previous()/goToStep()/reset()` allow programmatic control and testing. |
