import { LightningElement, api, track } from 'lwc';
import getTriggerTypes from '@salesforce/apex/WizardController.getTriggerTypes';
import getTriggerOptions from '@salesforce/apex/WizardController.getTriggerOptions';

export default class WizardStep2 extends LightningElement {
    
    @api ruleData;
    
    @track triggerTypes = [];
    @track selectedCategories = []; // Array of category objects: {label, value, apiName}
    
    // Changed: Use @track for proper reactivity
    @track selectedOptionsMap = {}; // Object instead of Map for better reactivity
    
    selectedCategory = ''; // Currently selected in dropdown
    currentTriggerOptions = []; // Options for currently selected category
    errorMessage = '';
    
    // Client-side cache
    triggerTypesLoaded = false;
    triggerOptionsCache = new Map(); // Map<category, options[]>

    connectedCallback() {
        this.loadTriggerTypes();
        this.loadExistingData();
    }

    loadExistingData() {
        // If coming back from next step, restore data
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
            return;
        }

        // Check if already selected
        if (this.selectedCategories.some(cat => cat.value === categoryValue)) {
            this.errorMessage = 'This category is already selected';
            this.selectedCategory = '';
            return;
        }

        // Check max limit
        if (this.selectedCategories.length >= 2) {
            this.errorMessage = 'Maximum 2 categories allowed';
            this.selectedCategory = '';
            return;
        }

        this.selectedCategory = categoryValue;
        this.errorMessage = '';

        // Load options for this category
        await this.loadTriggerOptions(categoryValue);

        // Add to selected categories
        const selectedCategoryObj = this.triggerTypes.find(t => t.value === categoryValue);
        if (selectedCategoryObj) {
            this.selectedCategories = [...this.selectedCategories, {
                label: selectedCategoryObj.label,
                value: selectedCategoryObj.value,
                apiName: selectedCategoryObj.apiName
            }];
            
            // Initialize empty selection for this category
            this.selectedOptionsMap = {
                ...this.selectedOptionsMap,
                [categoryValue]: []
            };
        }
    }

    async loadTriggerOptions(category) {
        // Check cache first
        if (this.triggerOptionsCache.has(category)) {
            this.currentTriggerOptions = this.triggerOptionsCache.get(category);
            return;
        }

        try {
            const response = await getTriggerOptions({ category });
            
            if (response.success) {
                this.currentTriggerOptions = response.options;
                
                // Cache the options
                this.triggerOptionsCache.set(category, response.options);
            } else {
                this.errorMessage = response.errorMessage;
            }
        } catch (error) {
            this.errorMessage = error.body?.message || 'Error loading trigger options';
        }
    }

    handleCategoryRemove(event) {
        const categoryValue = event.detail.name;
        
        // Remove from selected categories
        this.selectedCategories = this.selectedCategories.filter(cat => cat.value !== categoryValue);
        
        // Remove associated options
        const newOptionsMap = { ...this.selectedOptionsMap };
        delete newOptionsMap[categoryValue];
        this.selectedOptionsMap = newOptionsMap;
        
        // Clear current selection if it was this category
        if (this.selectedCategory === categoryValue) {
            this.selectedCategory = '';
            this.currentTriggerOptions = [];
        }

        this.errorMessage = '';
    }

    handleOptionSelect(event) {
        const { value, isSelected } = event.detail;
        
        if (!this.selectedCategory) {
            return;
        }

        // Get current selections for this category
        let currentSelections = this.selectedOptionsMap[this.selectedCategory] || [];
        
        if (isSelected) {
            // Add option if not already present
            if (!currentSelections.includes(value)) {
                currentSelections = [...currentSelections, value];
            }
        } else {
            // Remove option
            currentSelections = currentSelections.filter(v => v !== value);
        }

        // Update the map with new array - triggers reactivity
        this.selectedOptionsMap = {
            ...this.selectedOptionsMap,
            [this.selectedCategory]: currentSelections
        };
        
        console.log('Updated selections for', this.selectedCategory, ':', currentSelections);
    }

    handlePillRemove(event) {
        const { category, value } = event.detail;
        
        let currentSelections = this.selectedOptionsMap[category] || [];
        currentSelections = currentSelections.filter(v => v !== value);
        
        // Update the map - triggers reactivity
        this.selectedOptionsMap = {
            ...this.selectedOptionsMap,
            [category]: currentSelections
        };
    }

    handleBack() {
        this.dispatchEvent(new CustomEvent('back'));
    }

    handleNext() {
        if (!this.validateStep()) {
            return;
        }

        // Prepare data
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
        // Must have at least 1 category
        if (this.selectedCategories.length === 0) {
            this.errorMessage = 'Please select at least one trigger type category';
            return false;
        }

        // Each selected category must have at least 1 option
        for (let category of this.selectedCategories) {
            const options = this.selectedOptionsMap[category.value] || [];
            if (options.length === 0) {
                this.errorMessage = `Please select at least one option for ${category.label}`;
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

    get showOptionsDropdown() {
        return this.selectedCategory && this.currentTriggerOptions.length > 0;
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
                // Get full option objects from cache
                const cachedOptions = this.triggerOptionsCache.get(category.value) || [];
                const pills = selectedOptionValues.map(optValue => {
                    const option = cachedOptions.find(o => o.value === optValue);
                    return {
                        label: option ? option.label : optValue,
                        value: optValue
                    };
                });

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