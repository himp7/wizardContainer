import { LightningElement, api, track } from 'lwc';

export default class SearchableDropdown extends LightningElement {
    
    @api label = 'Select Options';
    @api placeholder = 'Search...';
    @api options = []; // Array of {label, value}
    @api selectedValues = []; // Array of selected values
    @api maxVisiblePills = 5; // Controls overflow "+N more" indicator
    
    @track searchTerm = '';
    @track isOpen = false;
    @track _selectedValues = []; // Internal tracking of selected values
    
    blurTimeout;

    connectedCallback() {
        // Initialize internal selected values
        this._selectedValues = [...this.selectedValues];
    }

    // Handle changes to selectedValues API property from parent
    updated(changedProperties) {
        if (changedProperties.has('selectedValues')) {
            this._selectedValues = [...this.selectedValues];
        }
    }

    get dropdownClass() {
        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${this.isOpen ? 'slds-is-open' : ''}`;
    }

    get filteredOptions() {
        const searchLower = this.searchTerm.toLowerCase();
        
        return this.options
            .filter(opt => opt.label.toLowerCase().includes(searchLower))
            .map(opt => ({
                ...opt,
                isSelected: this._selectedValues.includes(opt.value)
            }));
    }

    get hasFilteredOptions() {
        return this.filteredOptions.length > 0;
    }

    // Map selected values to pill objects { value, label }
    get selectedPills() {
        const map = new Map(this.options.map(o => [o.value, o.label]));
        const vals = this._selectedValues || [];
        const visible = vals.slice(0, this.maxVisiblePills);
        return visible.map(v => ({ value: v, label: map.get(v) || v }));
    }

    get hasOverflow() {
        const len = (this._selectedValues && this._selectedValues.length) || 0;
        return len > this.maxVisiblePills;
    }

    get overflowCount() {
        const len = (this._selectedValues && this._selectedValues.length) || 0;
        return len > this.maxVisiblePills ? (len - this.maxVisiblePills) : 0;
    }

    handleSearch(event) {
        this.searchTerm = event.target.value;
    }

    handleFocus() {
        this.isOpen = true;
    }

    handleBlur() {
        // Delay to allow click events to fire
        this.blurTimeout = setTimeout(() => {
            this.isOpen = false;
        }, 200);
    }

    handleOptionClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const value = event.currentTarget.dataset.value;
        const isCurrentlySelected = this._selectedValues.includes(value);
        
        this.dispatchSelectionEvent(value, !isCurrentlySelected);
    }

    handleCheckboxClick(event) {
        event.stopPropagation();
        
        const value = event.target.dataset.value;
        const isSelected = event.target.checked;
        
        this.dispatchSelectionEvent(value, isSelected);
    }

    // Remove via pill "x" button
    handlePillRemove(event) {
        event.preventDefault();
        event.stopPropagation();
        const value = event.currentTarget.dataset.value;
        this.dispatchSelectionEvent(value, false);
    }

    // Accessible label helper for remove buttons/text
    removeAriaLabel(label) {
        return `Remove ${label}`;
    }

    dispatchSelectionEvent(value, isSelected) {
        this.dispatchEvent(new CustomEvent('optionselect', {
            detail: {
                value: value,
                isSelected: isSelected
            }
        }));
    }

    disconnectedCallback() {
        if (this.blurTimeout) {
            clearTimeout(this.blurTimeout);
        }
    }
}
