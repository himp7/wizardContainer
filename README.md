# Salesforce Multi-Step Wizard Component

A reusable, metadata-driven wizard component for Salesforce Lightning Web Components (LWC).

## Features

- 4-step wizard for rule creation
- Metadata-driven configuration (no hardcoding)
- Client-side caching for performance
- Reusable components (searchable dropdown, pill container)
- Responsive SLDS-compliant UI
- Dynamic field mapping

## Architecture
```
wizardContainer (Parent)
├── wizardStep1 - Rule Details
├── wizardStep2 - Trigger Selection
├── wizardStep3 - Case Details
└── wizardStep4 - Summary & Confirmation
    ├── searchableDropdown (Reusable)
    └── pillContainer (Reusable)
```

## Quick Start

### Prerequisites

- Salesforce org with LWC support
- Salesforce CLI installed
- VS Code with Salesforce Extensions

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/himp7/wizardContainer.git
cd wizardContainer
```

2. **Authenticate with your org**
```bash
sfdx auth:web:login -a MyOrg
```

3. **Deploy to Salesforce**
```bash
sfdx force:source:deploy -p force-app/main/default
```

4. **Assign permissions**
   - Grant CRUD access to `Rule__c` object
   - Set Field-Level Security (FLS) for all fields

### Usage

**Option 1: Lightning App Builder**
1. Go to Setup → Lightning App Builder → New
2. Search for "wizardContainer"
3. Drag component onto page
4. Activate and assign to app

**Option 2: As a Modal (Recommended)**
```html
<!-- Parent Component -->
<template>
    <lightning-button label="Create Rule" onclick={openWizard}></lightning-button>
    
    <c-wizard-container 
        is-open={showWizard}
        onclose={handleClose}
        onrulesaved={handleRuleSaved}>
    </c-wizard-container>
</template>
```
```javascript
// Parent Component JS
export default class ParentComponent extends LightningElement {
    showWizard = false;

    openWizard() {
        this.showWizard = true;
    }

    handleClose() {
        this.showWizard = false;
    }

    handleRuleSaved(event) {
        console.log('Rule created:', event.detail.ruleId);
        this.showWizard = false;
    }
}
```

## Project Structure
```
force-app/main/default/
├── classes/
│   ├── WizardController.cls              # Main Apex controller
│   └── WizardController.cls-meta.xml
├── customMetadata/
│   ├── Trigger_Config.Account_Type.md-meta.xml
│   ├── Trigger_Config.Industry.md-meta.xml
│   └── ... (more metadata records)
├── objects/
│   ├── Rule__c/
│   │   └── Rule__c.object-meta.xml       # Custom object definition
│   └── Trigger_Config__mdt/
│       └── Trigger_Config__mdt.object-meta.xml
└── lwc/
    ├── wizardContainer/                   # Main wizard container
    ├── wizardStep1/                       # Step 1: Rule details
    ├── wizardStep2/                       # Step 2: Trigger selection
    ├── wizardStep3/                       # Step 3: Case details
    ├── wizardStep4/                       # Step 4: Summary
    ├── searchableDropdown/                # Reusable dropdown
    └── pillContainer/                     # Reusable pill display
```

## Configuration

### Custom Metadata: Trigger_Config__mdt

**Fields:**
- `Type__c` (Picklist): `Category` or `Option`
- `Value__c` (Text): The value to store
- `Category__c` (Text): Parent category for options
- `Field_API_Name__c` (Text): Field on Rule__c object
- `IsActive__c` (Checkbox): Active status
- `Sort_Order__c` (Number): Display order

**Example Records:**

| Label | Type | Value | Category | Field_API_Name__c |
|-------|------|-------|----------|-------------------|
| Account Type | Category | Account_Type | - | Account_Type__c |
| Enterprise | Option | Enterprise | Account_Type | - |
| SMB | Option | SMB | Account_Type | - |

### Adding New Trigger Types

1. Add field to `Rule__c` object (e.g., `Product_Line__c`)
2. Create Category record in `Trigger_Config__mdt`
3. Create Option records linked to category
4. No code changes needed

## Components

### wizardContainer
Parent component controlling navigation and state.

**Public Properties:**
- `isOpen` (Boolean): Controls modal visibility

**Events:**
- `close`: Fired when wizard closes
- `rulesaved`: Fired when rule is saved (contains `ruleId`)

### searchableDropdown
Reusable multi-select dropdown with search.

**Properties:**
- `label` (String): Field label
- `placeholder` (String): Search placeholder
- `options` (Array): Options to display
- `selectedValues` (Array): Pre-selected values

**Events:**
- `optionselect`: Fired when option selected/deselected

### pillContainer
Displays removable pills.

**Properties:**
- `pills` (Array): Pills to display `[{label, value}]`
- `category` (String): Category identifier

**Events:**
- `pillremove`: Fired when pill removed

## API Reference

### WizardController.cls
```apex
// Get all trigger categories
@AuraEnabled
public static TriggerTypeResponse getTriggerTypes()

// Get options for a category
@AuraEnabled
public static TriggerOptionResponse getTriggerOptions(String category)

// Save rule
@AuraEnabled
public static SaveRuleResponse saveRule(String ruleDataJSON)
```

## Testing

Run Apex tests:
```bash
sfdx force:apex:test:run -n WizardControllerTest -r human
```

Manual testing checklist:
- All 4 steps display correctly
- Navigation (Next/Back) works
- Cancel closes modal
- Category selection limited to 2
- Options display as pills
- Pills are removable
- Validation prevents empty submissions
- Rule saves with correct field values
- Success toast appears
- Modal closes after save

## Customization

### Change Number of Steps
1. Add/remove step components in `wizardContainer.html`
2. Update `lightning-progress-indicator` steps
3. Add step logic in `wizardContainer.js`

### Modify Validation
Edit validation in each step component's `validateStep()` method.

### Style Changes
Override SLDS classes in component CSS files.

## Troubleshooting

**Issue:** Component not visible in App Builder  
**Solution:** Check `wizardContainer.js-meta.xml` has `<isExposed>true</isExposed>`

**Issue:** Options not loading  
**Solution:** Verify `Category__c` in metadata matches exactly

**Issue:** Pills not updating  
**Solution:** Use immutable updates: `this.data = {...this.data, newValue}`

**Issue:** Save fails  
**Solution:** Check debug logs for Apex errors, verify FLS permissions

## Performance

- Metadata cached on first load only
- Options cached per category
- Average load time under 500ms
- Maximum 3 network calls on initial load

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Salesforce Lightning Design System
- LWC Documentation
- Salesforce Developer Community
