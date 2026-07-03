import { createElement } from 'lwc';
import MultiStepWizard from 'c/multiStepWizard';

/**
 * Helper that registers N fake steps against the wizard, mirroring what
 * c-wizard-step children do via the composed 'wizardstepregister' event.
 */
function registerSteps(element, count) {
    const steps = [];
    for (let i = 0; i < count; i++) {
        const step = {
            name: `step${i}`,
            label: `Step ${i}`,
            active: false,
            setActive(v) {
                this.active = v;
            },
            reportValidity: jest.fn(() => true)
        };
        steps.push(step);
        element.dispatchEvent(
            new CustomEvent('wizardstepregister', {
                bubbles: true,
                composed: true,
                detail: step
            })
        );
    }
    return steps;
}

describe('c-multi-step-wizard', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    function create() {
        const element = createElement('c-multi-step-wizard', {
            is: MultiStepWizard
        });
        document.body.appendChild(element);
        return element;
    }

    it('activates the first registered step by default', () => {
        const element = create();
        const steps = registerSteps(element, 3);
        expect(steps[0].active).toBe(true);
        expect(steps[1].active).toBe(false);
    });

    it('advances only when the active step is valid', () => {
        const element = create();
        const steps = registerSteps(element, 3);

        steps[0].reportValidity.mockReturnValueOnce(false);
        expect(element.next()).toBe(false);
        expect(steps[0].active).toBe(true);

        expect(element.next()).toBe(true);
        expect(steps[1].active).toBe(true);
        expect(steps[0].active).toBe(false);
    });

    it('navigates backwards without validation', () => {
        const element = create();
        const steps = registerSteps(element, 3);
        element.next();
        steps[1].reportValidity.mockReturnValue(false);
        expect(element.previous()).toBe(true);
        expect(steps[0].active).toBe(true);
    });

    it('fires a complete event on the last step', () => {
        const element = create();
        registerSteps(element, 2);
        const handler = jest.fn();
        element.addEventListener('complete', handler);

        element.next(); // -> step1 (last)
        element.next(); // completes
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('fires stepchange with direction metadata', () => {
        const element = create();
        registerSteps(element, 2);
        const handler = jest.fn();
        element.addEventListener('stepchange', handler);

        element.next();
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail.direction).toBe('next');
        expect(handler.mock.calls[0][0].detail.currentStep).toBe('step1');
    });

    it('reset returns to the first step', () => {
        const element = create();
        const steps = registerSteps(element, 3);
        element.next();
        element.next();
        element.reset();
        expect(steps[0].active).toBe(true);
    });
});
