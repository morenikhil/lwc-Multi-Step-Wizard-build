import { LightningElement, api } from 'lwc';

/**
 * wizardStep
 * -----------------------------------------------------------------------------
 * A single step inside a `c-multi-step-wizard`. It owns no navigation logic;
 * it simply registers itself with the parent wizard and exposes:
 *   - setActive(bool)    -> the wizard toggles visibility
 *   - reportValidity()   -> the wizard validates before advancing
 *
 * Step content is projected through the default slot, so consumers place any
 * markup (lightning-input, custom fields, a review summary, ...) inside.
 */
export default class WizardStep extends LightningElement {
    /** Unique key used for navigation and the progress indicator value. */
    @api name;

    /** Human-readable label shown in the progress indicator. */
    @api label;

    _active = false;
    _registered = false;

    connectedCallback() {
        if (!this.name) {
            // eslint-disable-next-line no-console
            console.error('wizardStep: the "name" attribute is required and must be unique.');
        }
        this.dispatchEvent(
            new CustomEvent('wizardstepregister', {
                bubbles: true,
                composed: true,
                detail: {
                    name: this.name,
                    label: this.label,
                    setActive: this.setActive.bind(this),
                    reportValidity: this.reportValidity.bind(this)
                }
            })
        );
        this._registered = true;
    }

    disconnectedCallback() {
        if (!this._registered) {
            return;
        }
        this.dispatchEvent(
            new CustomEvent('wizardstepderegister', {
                bubbles: true,
                composed: true,
                detail: { name: this.name }
            })
        );
    }

    /** Called by the parent wizard to show/hide this step. */
    setActive(active) {
        this._active = active;
    }

    get containerClass() {
        return this._active ? 'wizard-step' : 'wizard-step slds-hide';
    }

    /**
     * Validate every slotted form element that exposes reportValidity().
     * Works with lightning-input, lightning-combobox, lightning-textarea, etc.,
     * and with any custom component that surfaces a reportValidity() method.
     * Returns true only when every input is valid.
     */
    @api
    reportValidity() {
        const slot = this.template.querySelector('slot');
        if (!slot) {
            return true;
        }

        const inputs = [];
        const collect = (element) => {
            if (element && typeof element.reportValidity === 'function') {
                inputs.push(element);
            }
            if (element && typeof element.querySelectorAll === 'function') {
                element.querySelectorAll('*').forEach((child) => {
                    if (typeof child.reportValidity === 'function') {
                        inputs.push(child);
                    }
                });
            }
        };

        slot.assignedElements({ flatten: true }).forEach(collect);

        let allValid = true;
        inputs.forEach((input) => {
            // Call reportValidity on all inputs so every error surfaces at once.
            const valid = input.reportValidity();
            allValid = allValid && valid;
        });
        return allValid;
    }
}
