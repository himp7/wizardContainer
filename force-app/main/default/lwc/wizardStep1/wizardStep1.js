import { LightningElement, api } from 'lwc';

export default class WizardStep1 extends LightningElement {
    
    // Receive initial data from parent (if editing)
    @api ruleData;
    
    ruleName = '';
    description = '';
    isActive = true; // Default to checked
    errorMessage = '';

    connectedCallback() {
        // Populate fields if data exists (e.g., coming back from next step)
        if (this.ruleData) {
            this.ruleName = this.ruleData.ruleName || '';
            this.description = this.ruleData.description || '';
            this.isActive = this.ruleData.isActive !== undefined ? this.ruleData.isActive : true;
        }
    }

    handleInputChange(event) {
        const field = event.target.name;
        
        if (field === 'ruleName') {
            this.ruleName = event.target.value;
        } else if (field === 'description') {
            this.description = event.target.value;
        } else if (field === 'isActive') {
            this.isActive = event.target.checked;
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
            description: this.description,
            isActive: this.isActive
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