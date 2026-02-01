import { LightningElement, api, track } from 'lwc';

export default class WizardStep4 extends LightningElement {
    
    @api ruleData;
    
    @track isLoading = false;
    @track errorMessage = '';

    // Computed property for trigger summary
    get hasTriggerData() {
        return this.ruleData && 
               this.ruleData.triggerTypes && 
               this.ruleData.triggerTypes.length > 0;
    }

    get triggerSummary() {
        if (!this.hasTriggerData) {
            return [];
        }

        const summary = [];

        // Iterate through selected trigger types
        this.ruleData.triggerTypes.forEach(triggerType => {
            const categoryValue = triggerType.value;
            const categoryLabel = triggerType.label;
            
            // Get options for this category
            const options = this.ruleData.triggerOptionsMap[categoryValue] || [];
            
            if (options.length > 0) {
                summary.push({
                    category: categoryValue,
                    categoryLabel: categoryLabel,
                    options: options
                });
            }
        });

        return summary;
    }

    handleBack() {
        this.dispatchEvent(new CustomEvent('back'));
    }

    handleCreate() {
        // Dispatch create event to parent
        // Parent will handle the actual Apex call
        this.dispatchEvent(new CustomEvent('create', {
            detail: {
                ruleData: this.ruleData
            }
        }));
    }
}