import { LightningElement, api } from 'lwc';

export default class WizardStep1 extends LightningElement {
    
    // Receive initial data from parent (if editing)
    @api ruleData;
    
    ruleName = '';
    description = '';
    errorMessage = '';

    connectedCallback() {
        // Populate fields if data exists (e.g., coming back from next step)
        if (this.ruleData) {
            this.ruleName = this.ruleData.ruleName || '';
            this.description = this.ruleData.description || '';
        }
    }

    handleInputChange(event) {
        const field = event.target.name;
        const value = event.target.value;
        
        if (field === 'ruleName') {
            this.ruleName = value;
        } else if (field === 'description') {
            this.description = value;
        }
        
        // Clear error when user types
        this.errorMessage = '';
    }

    handleNext() {
        // Validate
        if (!this.validateForm()) {
            return;
        }

        // Send data to parent
        const stepData = {
            ruleName: this.ruleName,
            description: this.description
        };

        this.dispatchEvent(new CustomEvent('stepdata', {
            detail: {
                step: 1,
                data: stepData,
                action: 'next'
            }
        }));
    }

    handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    validateForm() {
        // Check required field
        const ruleNameInput = this.template.querySelector('lightning-input[name="ruleName"]');
        
        if (!this.ruleName || this.ruleName.trim() === '') {
            this.errorMessage = 'Please enter a rule name';
            ruleNameInput.focus();
            return false;
        }

        return true;
    }

    get isNextDisabled() {
        return !this.ruleName || this.ruleName.trim() === '';
    }
}