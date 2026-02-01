import { LightningElement, track, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getRules from '@salesforce/apex/RuleManagerController.getRules';

const COLUMNS = [
    { label: 'Rule Name', fieldName: 'Name', type: 'text' },
    { label: 'Description', fieldName: 'Description__c', type: 'text' },
    { label: 'Case Type', fieldName: 'Case_Type__c', type: 'text' },
    { label: 'Quantity', fieldName: 'Quantity__c', type: 'number' },
    { label: 'Active', fieldName: 'Is_Active__c', type: 'boolean' }
];

export default class RuleManager extends LightningElement {
    
    @track showWizard = false;
    @track rules = [];
    columns = COLUMNS;
    
    wiredRulesResult;

    // Wire to get rules
    @wire(getRules)
    wiredRules(result) {
        this.wiredRulesResult = result;
        if (result.data) {
            this.rules = result.data;
        } else if (result.error) {
            this.showToast('Error', 'Error loading rules', 'error');
        }
    }

    get hasRules() {
        return this.rules && this.rules.length > 0;
    }

    get ruleCount() {
        return this.rules ? this.rules.length : 0;
    }

    handleOpenWizard() {
        this.showWizard = true;
    }

    handleCloseWizard() {
        this.showWizard = false;
    }

    handleRuleSaved(event) {
        const ruleId = event.detail.ruleId;
        
        // Show success message
        this.showToast('Success', `Rule created successfully (ID: ${ruleId})`, 'success');
        
        // Close wizard
        this.showWizard = false;
        
        // Refresh the rules list
        this.refreshRules();
    }

    refreshRules() {
        // Refresh the wired data
        return refreshApex(this.wiredRulesResult);
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