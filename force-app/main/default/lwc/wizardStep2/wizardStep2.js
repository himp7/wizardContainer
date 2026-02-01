import { LightningElement, api, track } from 'lwc';
import getTriggerTypes from '@salesforce/apex/WizardController.getTriggerTypes';
import getTriggerOptions from '@salesforce/apex/WizardController.getTriggerOptions';

export default class WizardStep2 extends LightningElement {
    
    @api ruleData;
    
    @track triggerTypes = [];
    @track selectedCategories = [];
    @track selectedOptionsMap = {};
    @track currentRenderingType = ''; // Track rendering type of selected category
    
    selectedCategory = '';
    currentTriggerOptions = [];
    manualInputValue = '';
    errorMessage = '';
    
    // Client-side cache
    triggerTypesLoaded = false;
    triggerOptionsCache = new Map();

    connectedCallback() {
        this.loadTriggerTypes();
        this.loadExistingData();
    }

    loadExistingData() {
        if (this.ruleData && this.ruleData.triggerTypes && this.ruleData.triggerTypes.length > 0) {
            this.selectedCategories = [...this.ruleData.triggerTypes];
            if (this.ruleData.triggerOptionsMap) {
                this.selectedOptionsMap = { ...this.ruleData.triggerOptionsMap };
            }
        }
    }

    async loadTriggerTypes() {
        if (this.triggerTypesLoaded) {
            return;
        }

        try {
            const response = await getTriggerTypes();
            
            if (response.success) {
                this.triggerTypes = response.triggerTypes;
                this.triggerTypesLoaded = true;
            } else {
                this.errorMessage = response.errorMessage;
            }
        } catch (error) {
            this.errorMessage = error.body?.message || 'Error loading trigger types';
        }
    }

    async handleCategoryChange(event) {
        const categoryValue = event.detail.value;
        
        if (!categoryValue) {
            this.selectedCategory = '';
            this.currentTriggerOptions = [];
            this.currentRenderingType = '';
            this.manualInputValue = '';
            return;
        }

        if (this.selectedCategories.some(cat => cat.value === categoryValue)) {
            this.errorMessage = 'This category is already selected';
            this.selectedCategory = '';
            return;
        }

        if (this.selectedCategories.length >= 2) {
            this.errorMessage = 'Maximum 2 categories allowed';
            this.selectedCategory = '';
            return;
        }

        this.selectedCategory = categoryValue;
        this.errorMessage = '';
        this.manualInputValue = '';

        // Get selected category object with rendering type
        const selectedCategoryObj = this.triggerTypes.find(t => t.value === categoryValue);
        if (selectedCategoryObj) {
            this.currentRenderingType = selectedCategoryObj.renderingType || 'Searchable Dropdown';
            
            // Add to selected categories
            this.selectedCategories = [...this.selectedCategories, {
                label: selectedCategoryObj.label,
                value: selectedCategoryObj.value,
                apiName: selectedCategoryObj.apiName,
                renderingType: this.currentRenderingType
            }];
            
            // Initialize empty selection
            this.selectedOptionsMap = {
                ...this.selectedOptionsMap,
                [categoryValue]: []
            };

            // Load options only if searchable dropdown
            if (this.currentRenderingType === 'Searchable Dropdown') {
                await this.loadTriggerOptions(categoryValue);
            }
        }
    }

    async loadTriggerOptions(category) {
        if (this.triggerOptionsCache.has(category)) {
            this.currentTriggerOptions = this.triggerOptionsCache.get(category);
            return;
        }

        try {
            const response = await getTriggerOptions({ category });
            
            if (response.success) {
                this.currentTriggerOptions = response.options;
                this.triggerOptionsCache.set(category, response.options);
            } else {
                this.errorMessage = response.errorMessage;
            }
        } catch (error) {
            this.errorMessage = error.body?.message || 'Error loading trigger options';
        }
    }

    handleManualInputChange(event) {
        this.manualInputValue = event.target.value;
        
        // Update the selection with manual input
        if (this.manualInputValue.trim()) {
            this.selectedOptionsMap = {
                ...this.selectedOptionsMap,
                [this.selectedCategory]: [this.manualInputValue.trim()]
            };
        } else {
            this.selectedOptionsMap = {
                ...this.selectedOptionsMap,
                [this.selectedCategory]: []
            };
        }
    }

    handleCategoryRemove(event) {
        const categoryValue = event.detail.name;
        
        this.selectedCategories = this.selectedCategories.filter(cat => cat.value !== categoryValue);
        
        const newOptionsMap = { ...this.selectedOptionsMap };
        delete newOptionsMap[categoryValue];
        this.selectedOptionsMap = newOptionsMap;
        
        if (this.selectedCategory === categoryValue) {
            this.selectedCategory = '';
            this.currentTriggerOptions = [];
            this.currentRenderingType = '';
            this.manualInputValue = '';
        }

        this.errorMessage = '';
    }

    handleOptionSelect(event) {
        const { value, isSelected } = event.detail;
        
        if (!this.selectedCategory) {
            return;
        }

        let currentSelections = this.selectedOptionsMap[this.selectedCategory] || [];
        
        if (isSelected) {
            if (!currentSelections.includes(value)) {
                currentSelections = [...currentSelections, value];
            }
        } else {
            currentSelections = currentSelections.filter(v => v !== value);
        }

        this.selectedOptionsMap = {
            ...this.selectedOptionsMap,
            [this.selectedCategory]: currentSelections
        };
    }

    handlePillRemove(event) {
        const { category, value } = event.detail;
        
        let currentSelections = this.selectedOptionsMap[category] || [];
        currentSelections = currentSelections.filter(v => v !== value);
        
        this.selectedOptionsMap = {
            ...this.selectedOptionsMap,
            [category]: currentSelections
        };

        // Clear manual input if it matches
        if (this.selectedCategory === category && this.manualInputValue === value) {
            this.manualInputValue = '';
        }
    }

    handleBack() {
        this.dispatchEvent(new CustomEvent('back'));
    }

    handleNext() {
        if (!this.validateStep()) {
            return;
        }

        const stepData = {
            triggerTypes: this.selectedCategories,
            triggerOptionsMap: this.selectedOptionsMap
        };

        this.dispatchEvent(new CustomEvent('stepdata', {
            detail: {
                step: 2,
                data: stepData,
                action: 'next'
            }
        }));
    }

    validateStep() {
        if (this.selectedCategories.length === 0) {
            this.errorMessage = 'Please select at least one trigger type category';
            return false;
        }

        for (let category of this.selectedCategories) {
            const options = this.selectedOptionsMap[category.value] || [];
            if (options.length === 0) {
                this.errorMessage = `Please select or enter at least one option for ${category.label}`;
                return false;
            }
        }

        this.errorMessage = '';
        return true;
    }

    // Computed properties
    get triggerTypeOptions() {
        return this.triggerTypes.map(t => ({
            label: t.label,
            value: t.value
        }));
    }

    get isCategoryDropdownDisabled() {
        return this.selectedCategories.length >= 2;
    }

    get hasSelectedCategories() {
        return this.selectedCategories.length > 0;
    }

    get selectedCategoriesDisplay() {
        return this.selectedCategories;
    }

    get isSearchableDropdown() {
        return this.currentRenderingType === 'Searchable Dropdown';
    }

    get isManualInput() {
        return this.currentRenderingType === 'Manual Input';
    }

    get currentSelectedOptions() {
        return this.selectedOptionsMap[this.selectedCategory] || [];
    }

    get currentCategoryLabel() {
        const category = this.selectedCategories.find(cat => cat.value === this.selectedCategory);
        return category ? category.label : '';
    }

    get hasCurrentCategorySelections() {
        if (!this.selectedCategory) return false;
        const selections = this.selectedOptionsMap[this.selectedCategory] || [];
        return selections.length > 0;
    }

    get currentCategoryPills() {
        if (!this.selectedCategory) return [];
        
        const selectedOptionValues = this.selectedOptionsMap[this.selectedCategory] || [];
        
        // For manual input, just return the value as label
        if (this.isManualInput) {
            return selectedOptionValues.map(optValue => ({
                label: optValue,
                value: optValue
            }));
        }
        
        // For searchable dropdown, get labels from cache
        const cachedOptions = this.triggerOptionsCache.get(this.selectedCategory) || [];
        return selectedOptionValues.map(optValue => {
            const option = cachedOptions.find(o => o.value === optValue);
            return {
                label: option ? option.label : optValue,
                value: optValue
            };
        });
    }

    get hasSelectedOptions() {
        return Object.keys(this.selectedOptionsMap).length > 0 && 
               Object.values(this.selectedOptionsMap).some(opts => opts.length > 0);
    }

    get categoriesWithOptions() {
        const result = [];
        
        this.selectedCategories.forEach(category => {
            const selectedOptionValues = this.selectedOptionsMap[category.value] || [];
            
            if (selectedOptionValues.length > 0) {
                let pills;
                
                if (category.renderingType === 'Manual Input') {
                    pills = selectedOptionValues.map(optValue => ({
                        label: optValue,
                        value: optValue
                    }));
                } else {
                    const cachedOptions = this.triggerOptionsCache.get(category.value) || [];
                    pills = selectedOptionValues.map(optValue => {
                        const option = cachedOptions.find(o => o.value === optValue);
                        return {
                            label: option ? option.label : optValue,
                            value: optValue
                        };
                    });
                }

                result.push({
                    name: category.value,
                    label: category.label,
                    options: pills
                });
            }
        });

        return result;
    }

    get isNextDisabled() {
        return this.selectedCategories.length === 0;
    }
}