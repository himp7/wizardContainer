import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveRule from '@salesforce/apex/WizardController.saveRule';

export default class WizardContainer extends LightningElement {
    
    @track isOpen = true; // Start open by default
    
    @track currentStep = 1;
    @track ruleData = {
        ruleName: '',
        description: '',
        isActive: true,
        triggerTypes: [],
        triggerOptionsMap: {},
        caseType: '',
        quantity: null
    };

    // Step visibility getters
    get currentStepName() {
        return `step${this.currentStep}`;
    }

    get isStep1() {
        return this.currentStep === 1;
    }

    get isStep2() {
        return this.currentStep === 2;
    }

    get isStep3() {
        return this.currentStep === 3;
    }

    get isStep4() {
        return this.currentStep === 4;
    }

    // Event handlers
    handleStepData(event) {
        const { step, data, action } = event.detail;

        // Update rule data based on step
        switch(step) {
            case 1:
                this.ruleData.ruleName = data.ruleName;
                this.ruleData.description = data.description;
                this.ruleData.isActive = data.isActive;
                break;
            case 2:
                this.ruleData.triggerTypes = data.triggerTypes;
                this.ruleData.triggerOptionsMap = data.triggerOptionsMap;
                break;
            case 3:
                this.ruleData.caseType = data.caseType;
                this.ruleData.quantity = data.quantity;
                break;
        }

        // Navigate based on action
        if (action === 'next') {
            this.currentStep++;
        }
    }

    handleBack() {
        if (this.currentStep > 1) {
            this.currentStep--;
        }
    }

    handleCancel() {
        // Reset wizard state
        this.resetWizard();
        
        // Close the modal
        this.isOpen = false;
        
        // Dispatch event to parent (if exists)
        this.dispatchEvent(new CustomEvent('close'));
    }

    async handleCreate() {
        try {
            // Prepare data for Apex
            const ruleDataJSON = JSON.stringify(this.ruleData);
            
            // Call Apex
            const response = await saveRule({ ruleDataJSON });

            if (response.success) {
                // Show success toast
                this.showToast('Success', response.message, 'success');
                
                // Dispatch event to parent with rule ID (if exists)
                this.dispatchEvent(new CustomEvent('rulesaved', {
                    detail: { ruleId: response.ruleId }
                }));
                
                // Reset wizard state
                this.resetWizard();
                
                // Close the modal
                this.isOpen = false;
                
                // Dispatch close event
                this.dispatchEvent(new CustomEvent('close'));
                
            } else {
                this.showToast('Error', response.errorMessage, 'error');
            }

        } catch (error) {
            this.showToast('Error', error.body?.message || 'Unknown error occurred', 'error');
        }
    }

    resetWizard() {
        // Reset to initial state
        this.currentStep = 1;
        this.ruleData = {
            ruleName: '',
            description: '',
            isActive: true,
            triggerTypes: [],
            triggerOptionsMap: {},
            caseType: '',
            quantity: null
        };
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }

    // Public API to open/close from parent
    @api
    openWizard() {
        this.resetWizard();
        this.isOpen = true;
    }

    @api
    closeWizard() {
        this.handleCancel();
    }
}