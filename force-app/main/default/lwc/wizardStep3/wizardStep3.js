import { LightningElement, api } from 'lwc';

export default class WizardStep3 extends LightningElement {
    
    @api ruleData;
    
    caseType = '';
    quantity = null;
    errorMessage = '';

    connectedCallback() {
        // Load existing data if coming back from next step
        if (this.ruleData) {
            this.caseType = this.ruleData.caseType || '';
            this.quantity = this.ruleData.quantity || null;
        }
    }
get caseTypeOptions() {
    return [
        { label: 'Service Request', value: 'Service Request' },
        { label: 'Incident', value: 'Incident' },
        { label: 'Problem', value: 'Problem' },
        { label: 'Change Request', value: 'Change Request' },
        { label: 'Question', value: 'Question' }
    ];
}
    

    handleInputChange(event) {
        const field = event.target.name;
        const value = event.target.value;
        
        if (field === 'caseType') {
            this.caseType = value;
        } else if (field === 'quantity') {
            // Convert to number and validate
            const numValue = parseInt(value, 10);
            this.quantity = isNaN(numValue) ? null : numValue;
        }
        
        // Clear error when user types
        this.errorMessage = '';
    }

    handleBack() {
        this.dispatchEvent(new CustomEvent('back'));
    }

    handleNext() {
        if (!this.validateForm()) {
            return;
        }

        // Prepare data
        const stepData = {
            caseType: this.caseType.trim(),
            quantity: this.quantity
        };

        this.dispatchEvent(new CustomEvent('stepdata', {
            detail: {
                step: 3,
                data: stepData,
                action: 'next'
            }
        }));
    }

    validateForm() {
        let isValid = true;

        // Get input fields
        const caseTypeInput = this.template.querySelector('lightning-input[name="caseType"]');
        const quantityInput = this.template.querySelector('lightning-input[name="quantity"]');

        // Validate Case Type
        if (!this.caseType || this.caseType.trim() === '') {
            this.errorMessage = 'Please enter a case type';
            if (caseTypeInput) {
                caseTypeInput.focus();
            }
            return false;
        }

        // Validate Quantity
        if (!this.quantity || this.quantity < 1) {
            this.errorMessage = 'Please enter a valid quantity (minimum 1)';
            if (quantityInput) {
                quantityInput.focus();
            }
            return false;
        }

        if (this.quantity > 100) {
            this.errorMessage = 'Quantity cannot exceed 100';
            if (quantityInput) {
                quantityInput.focus();
            }
            return false;
        }

        // Check if quantity is an integer
        if (!Number.isInteger(this.quantity)) {
            this.errorMessage = 'Quantity must be a whole number';
            if (quantityInput) {
                quantityInput.focus();
            }
            return false;
        }

        this.errorMessage = '';
        return true;
    }

    get isNextDisabled() {
        return !this.caseType || 
               this.caseType.trim() === '' || 
               !this.quantity || 
               this.quantity < 1 || 
               this.quantity > 100;
    }
}