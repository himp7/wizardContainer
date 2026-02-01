import { LightningElement, api } from 'lwc';

export default class PillContainer extends LightningElement {
    
    @api pills = []; // Array of {label, value}
    @api category = ''; // Category this pill belongs to

    get hasPills() {
        return this.pills && this.pills.length > 0;
    }

    handleRemove(event) {
        const value = event.detail.name;
        
        this.dispatchEvent(new CustomEvent('pillremove', {
            detail: {
                category: this.category,
                value: value
            }
        }));
    }
}