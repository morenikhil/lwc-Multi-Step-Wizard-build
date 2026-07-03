import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createContact from '@salesforce/apex/WizardController.createContact';

const EMPTY_FORM = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    country: '',
    contactMethod: '',
    newsletter: false
};

const CONTACT_METHOD_OPTIONS = [
    { label: 'Email', value: 'Email' },
    { label: 'Phone', value: 'Phone' },
    { label: 'Mail', value: 'Mail' }
];

/**
 * wizardDemo
 * -----------------------------------------------------------------------------
 * Example consumer of c-multi-step-wizard. Demonstrates:
 *   - required-field validation gating navigation
 *   - a data-driven review step
 *   - submitting to Apex on completion
 */
export default class WizardDemo extends LightningElement {
    @track form = { ...EMPTY_FORM };
    isSubmitting = false;
    contactMethodOptions = CONTACT_METHOD_OPTIONS;

    handleFieldChange(event) {
        const field = event.target.dataset.field;
        const value =
            event.target.type === 'checkbox'
                ? event.target.checked
                : event.target.value;
        this.form = { ...this.form, [field]: value };
    }

    get fullName() {
        return `${this.form.firstName} ${this.form.lastName}`.trim();
    }

    get newsletterLabel() {
        return this.form.newsletter ? 'Yes' : 'No';
    }

    async handleComplete() {
        this.isSubmitting = true;
        try {
            const recordId = await createContact({
                payload: JSON.stringify(this.form)
            });
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: `Contact created (${recordId}).`,
                    variant: 'success'
                })
            );
            this.form = { ...EMPTY_FORM };
            this.template.querySelector('c-multi-step-wizard').reset();
        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating contact',
                    message: this._reduceError(error),
                    variant: 'error'
                })
            );
        } finally {
            this.isSubmitting = false;
        }
    }

    handleStepChange(event) {
        // Useful hook for analytics / conditional logic.
        // eslint-disable-next-line no-console
        console.log('Wizard moved to step:', event.detail.currentStep);
    }

    _reduceError(error) {
        if (Array.isArray(error?.body)) {
            return error.body.map((e) => e.message).join(', ');
        }
        return error?.body?.message || error?.message || 'Unknown error';
    }
}
