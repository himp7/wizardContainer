import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import saveRule from '@salesforce/apex/WizardController.saveRule';

export default class WizardContainer extends LightningElement {
    
    @track currentStep = 1;
    @track ruleData = {
        ruleName: '',
        description: '',
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
        // Close the modal/wizard
        this.dispatchEvent(new CustomEvent('close'));
    }

    async handleCreate() {
    // try {
    //     // Show loading in step 4
    //     const step4Component = this.template.querySelector('c-wizard-step4');
    //     if (step4Component) {
    //         step4Component.isLoading = true;
    //     }

    //     // Prepare data for Apex
    //     const ruleDataJSON = JSON.stringify(this.ruleData);
        
    //     // Call Apex
    //     const response = await saveRule({ ruleDataJSON });

    //     if (response.success) {
    //         // Show success toast
    //         this.showToast('Success', response.message, 'success');
            
    //         // Dispatch event to parent (e.g., refresh list view)
    //         this.dispatchEvent(new CustomEvent('rulesaved', {
    //             detail: { ruleId: response.ruleId }
    //         }));
            
    //         // Close wizard
    //         this.handleCancel();
            
    //     } else {
    //         // Show error in step 4
    //         if (step4Component) {
    //             step4Component.isLoading = false;
    //             step4Component.errorMessage = response.errorMessage;
    //         }
    //     }

    // } catch (error) {
    //     const step4Component = this.template.querySelector('c-wizard-step4');
    //     if (step4Component) {
    //         step4Component.isLoading = false;
    //         step4Component.errorMessage = error.body?.message || 'An unexpected error occurred';
    //     }
    // }
}
    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
}