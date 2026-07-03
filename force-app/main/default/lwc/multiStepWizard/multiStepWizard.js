import { LightningElement, api, track } from 'lwc';

/**
 * multiStepWizard
 * -----------------------------------------------------------------------------
 * A reusable, slot-based, stepper-driven wizard container.
 *
 * Consumers compose the wizard by nesting `c-wizard-step` children:
 *
 *   <c-multi-step-wizard onstepchange={...} oncomplete={...}>
 *       <c-wizard-step name="details"  label="Details">...</c-wizard-step>
 *       <c-wizard-step name="review"   label="Review">...</c-wizard-step>
 *   </c-multi-step-wizard>
 *
 * Communication follows the same pattern as `lightning-tabset` / `lightning-tab`:
 * each child step self-registers with the container via a composed, bubbling
 * event, handing the container a set of callbacks. The container never reaches
 * into the child's DOM directly, which keeps the two components decoupled.
 */
export default class MultiStepWizard extends LightningElement {
    // ---- Public configuration -------------------------------------------------

    /** Progress indicator style: 'base' (numbered) or 'path' (chevrons). */
    @api progressType = 'base';

    /** Hide the progress indicator entirely. */
    @api hideProgressIndicator = false;

    /** Hide the built-in Previous/Next footer (drive navigation via the API). */
    @api hideFooter = false;

    /** Allow clicking an already-visited step in the indicator to jump back. */
    @api allowStepNavigation = false;

    /** Button labels (localizable by the consumer). */
    @api previousLabel = 'Previous';
    @api nextLabel = 'Next';
    @api finishLabel = 'Submit';

    // ---- Internal state -------------------------------------------------------

    @track _steps = [];
    _activeStepName;
    _visited = new Set();
    hasError = false;

    // ---- Step registration (from c-wizard-step children) ----------------------

    handleStepRegister(event) {
        event.stopPropagation();
        const step = event.detail;

        // Guard against duplicate names — they break navigation and the indicator.
        if (this._steps.some((s) => s.name === step.name)) {
            // eslint-disable-next-line no-console
            console.error(
                `multiStepWizard: duplicate step name "${step.name}". Step names must be unique.`
            );
            return;
        }

        this._steps = [...this._steps, step];

        // Activate the first registered step by default.
        if (!this._activeStepName) {
            this._activeStepName = step.name;
            this._visited.add(step.name);
        }
        this._syncSteps();
    }

    handleStepDeregister(event) {
        event.stopPropagation();
        const { name } = event.detail;
        this._steps = this._steps.filter((s) => s.name !== name);
        if (this._activeStepName === name && this._steps.length) {
            this._activeStepName = this._steps[0].name;
        }
        this._syncSteps();
    }

    // ---- Derived state --------------------------------------------------------

    get progressSteps() {
        return this._steps.map((s) => ({ label: s.label, value: s.name }));
    }

    get currentIndex() {
        return this._steps.findIndex((s) => s.name === this._activeStepName);
    }

    get activeStep() {
        return this._steps[this.currentIndex];
    }

    get isFirstStep() {
        return this.currentIndex <= 0;
    }

    get isLastStep() {
        return this.currentIndex === this._steps.length - 1;
    }

    get showProgress() {
        return !this.hideProgressIndicator && this._steps.length > 0;
    }

    get showFooter() {
        return !this.hideFooter && this._steps.length > 0;
    }

    get showPrevious() {
        return !this.isFirstStep;
    }

    get primaryLabel() {
        return this.isLastStep ? this.finishLabel : this.nextLabel;
    }

    // ---- Public imperative API ------------------------------------------------

    /** Advance to the next step (validating the current one first). */
    @api
    next() {
        if (!this._validateActiveStep()) {
            this.hasError = true;
            return false;
        }
        this.hasError = false;

        if (this.isLastStep) {
            this._dispatch('complete', {
                stepName: this._activeStepName,
                stepIndex: this.currentIndex
            });
            return true;
        }

        const target = this._steps[this.currentIndex + 1];
        this._activate(target.name, 'next');
        return true;
    }

    /** Move to the previous step (no validation on the way back). */
    @api
    previous() {
        if (this.isFirstStep) {
            return false;
        }
        this.hasError = false;
        const target = this._steps[this.currentIndex - 1];
        this._activate(target.name, 'previous');
        return true;
    }

    /** Jump directly to a named step (forward jumps validate the active step). */
    @api
    goToStep(name) {
        const targetIndex = this._steps.findIndex((s) => s.name === name);
        if (targetIndex === -1 || targetIndex === this.currentIndex) {
            return false;
        }
        if (targetIndex > this.currentIndex && !this._validateActiveStep()) {
            this.hasError = true;
            return false;
        }
        this.hasError = false;
        this._activate(name, targetIndex > this.currentIndex ? 'next' : 'previous');
        return true;
    }

    /** Reset the wizard back to the first step and clear visited history. */
    @api
    reset() {
        this.hasError = false;
        this._visited = new Set();
        if (this._steps.length) {
            this._activeStepName = this._steps[0].name;
            this._visited.add(this._activeStepName);
            this._syncSteps();
        }
    }

    /** Programmatically re-run validation for the active step. */
    @api
    reportValidity() {
        return this._validateActiveStep();
    }

    // ---- Event handlers -------------------------------------------------------

    handleNext() {
        this.next();
    }

    handlePrevious() {
        this.previous();
    }

    handleProgressStepClick(event) {
        if (!this.allowStepNavigation) {
            return;
        }
        const name = event.currentTarget.dataset.name;
        const targetIndex = this._steps.findIndex((s) => s.name === name);
        // Only allow jumping back to a previously visited step.
        if (targetIndex < this.currentIndex && this._visited.has(name)) {
            this.hasError = false;
            this._activate(name, 'previous');
        }
    }

    // ---- Internals ------------------------------------------------------------

    _activate(name, direction) {
        const previousName = this._activeStepName;
        this._activeStepName = name;
        this._visited.add(name);
        this._syncSteps();
        this._dispatch('stepchange', {
            previousStep: previousName,
            currentStep: name,
            currentIndex: this.currentIndex,
            direction
        });
    }

    _syncSteps() {
        this._steps.forEach((step) => {
            step.setActive(step.name === this._activeStepName);
        });
    }

    _validateActiveStep() {
        const step = this.activeStep;
        if (step && typeof step.reportValidity === 'function') {
            return step.reportValidity();
        }
        return true;
    }

    _dispatch(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail }));
    }
}
