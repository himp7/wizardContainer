import { LightningElement, api, track } from 'lwc';
import getPriorityOptions from '@salesforce/apex/WizardController.getPriorityOptions';

export default class WizardStep3 extends LightningElement {
    
    @api ruleData;
    
    @track caseType = '';
    @track priority = '';
    @track daysBefore = null;
    @track caseDescription = '';
    @track location = false;
    @track errorMessage = '';
    @track priorityOptions = [];

    // Case Type picklist options
    caseTypeOptions = [
        { label: 'Service Request', value: 'Service Request' },
        { label: 'Incident', value: 'Incident' },
        { label: 'Problem', value: 'Problem' },
        { label: 'Change Request', value: 'Change Request' },
        { label: 'Question', value: 'Question' },
        { label: 'Complaint', value: 'Complaint' }
    ];

    // Client-side cache
    priorityOptionsLoaded = false;

    connectedCallback() {
        this.loadPriorityOptions();
        this.loadExistingData();
    }

    loadExistingData() {
        // Load existing data if coming back from next step
        if (this.ruleData) {
            this.caseType = this.ruleData.caseType || '';
            this.priority = this.ruleData.priority || '';
            this.daysBefore = this.ruleData.daysBefore !== undefined ? this.ruleData.daysBefore : null;
            this.caseDescription = this.ruleData.caseDescription || '';
            this.location = this.ruleData.location !== undefined ? this.ruleData.location : false;
        }
    }

    async loadPriorityOptions() {
        // Only fetch once (client-side caching)
        if (this.priorityOptionsLoaded) {
            return;
        }

        try {
            const response = await getPriorityOptions();
            
            if (response.success) {
                this.priorityOptions = response.options.map(opt => ({
                    label: opt.label,
                    value: opt.value
                }));
                this.priorityOptionsLoaded = true;
            } else {
                this.errorMessage = response.errorMessage;
            }
        } catch (error) {
            this.errorMessage = error.body?.message || 'Error loading priority options';
            console.error('Error loading priority options:', error);
        }
    }

    handleInputChange(event) {
        const field = event.target.name;
        const value = event.target.value;
        
        if (field === 'caseType') {
            this.caseType = value;
        } else if (field === 'priority') {
            this.priority = value;
        } else if (field === 'daysBefore') {
            const numValue = parseInt(value, 10);
            this.daysBefore = isNaN(numValue) ? null : numValue;
        } else if (field === 'caseDescription') {
            this.caseDescription = value;
        }
        
        // Clear error when user types
        this.errorMessage = '';
    }

    handleCheckboxChange(event) {
        const field = event.target.name;
        
        if (field === 'location') {
            this.location = event.target.checked;
        }
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
            caseType: this.caseType,
            priority: this.priority,
            daysBefore: this.daysBefore,
            caseDescription: this.caseDescription,
            location: this.location
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
        // Get input fields
        const caseTypeInput = this.template.querySelector('lightning-combobox[name="caseType"]');
        const priorityInput = this.template.querySelector('lightning-combobox[name="priority"]');
        const daysBeforeInput = this.template.querySelector('lightning-input[name="daysBefore"]');

        // Validate Case Type
        if (!this.caseType || this.caseType.trim() === '') {
            this.errorMessage = 'Please select a case type';
            if (caseTypeInput) {
                caseTypeInput.focus();
            }
            return false;
        }

        // Validate Priority
        if (!this.priority || this.priority.trim() === '') {
            this.errorMessage = 'Please select a priority';
            if (priorityInput) {
                priorityInput.focus();
            }
            return false;
        }

        // Validate Days Before
        if (this.daysBefore === null || this.daysBefore === undefined) {
            this.errorMessage = 'Please enter days before';
            if (daysBeforeInput) {
                daysBeforeInput.focus();
            }
            return false;
        }

        if (this.daysBefore < 0) {
            this.errorMessage = 'Days before must be at least 0';
            if (daysBeforeInput) {
                daysBeforeInput.focus();
            }
            return false;
        }

        if (this.daysBefore > 365) {
            this.errorMessage = 'Days before cannot exceed 365';
            if (daysBeforeInput) {
                daysBeforeInput.focus();
            }
            return false;
        }

        // Check if days before is an integer
        if (!Number.isInteger(this.daysBefore)) {
            this.errorMessage = 'Days before must be a whole number';
            if (daysBeforeInput) {
                daysBeforeInput.focus();
            }
            return false;
        }

        this.errorMessage = '';
        return true;
    }

    get isNextDisabled() {
        return !this.caseType || 
               this.caseType.trim() === '' || 
               !this.priority ||
               this.priority.trim() === '' ||
               this.daysBefore === null ||
               this.daysBefore === undefined ||
               this.daysBefore < 0 || 
               this.daysBefore > 365;
    }
}