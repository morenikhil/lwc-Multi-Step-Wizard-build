import { createElement } from 'lwc';
import WizardStep from 'c/wizardStep';

describe('c-wizard-step', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('dispatches a register event on connect with its callbacks', () => {
        const element = createElement('c-wizard-step', { is: WizardStep });
        element.name = 'details';
        element.label = 'Details';

        const handler = jest.fn();
        // Listen on document because the event is composed + bubbles.
        document.addEventListener('wizardstepregister', handler);
        document.body.appendChild(element);

        expect(handler).toHaveBeenCalledTimes(1);
        const detail = handler.mock.calls[0][0].detail;
        expect(detail.name).toBe('details');
        expect(detail.label).toBe('Details');
        expect(typeof detail.setActive).toBe('function');
        expect(typeof detail.reportValidity).toBe('function');
    });

    it('hides its content until activated', () => {
        const element = createElement('c-wizard-step', { is: WizardStep });
        element.name = 'details';
        document.body.appendChild(element);

        let panel = element.shadowRoot.querySelector('.wizard-step');
        expect(panel.classList).toContain('slds-hide');

        element.setActive(true);
        return Promise.resolve().then(() => {
            panel = element.shadowRoot.querySelector('.wizard-step');
            expect(panel.classList).not.toContain('slds-hide');
        });
    });

    it('reportValidity returns true when there are no inputs', () => {
        const element = createElement('c-wizard-step', { is: WizardStep });
        element.name = 'empty';
        document.body.appendChild(element);
        expect(element.reportValidity()).toBe(true);
    });
});
