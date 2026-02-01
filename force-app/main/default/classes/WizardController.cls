public with sharing class WizardController {
    
    // Fetch all trigger type CATEGORIES
    @AuraEnabled
    public static TriggerTypeResponse getTriggerTypes() {
        TriggerTypeResponse response = new TriggerTypeResponse();
        try {
            List<Trigger_Config__mdt> configs = [ 
                SELECT Label, Value__c, Field_API_Name__c, DeveloperName
                FROM Trigger_Config__mdt
                WHERE Type__c = 'Category' 
                AND IsActive__c = true
                ORDER BY Sort_Order__c ASC, Label ASC
            ];
            
            for (Trigger_Config__mdt config : configs) {
                response.triggerTypes.add(new TriggerTypeWrapper(
                    config.Label,
                    config.Value__c,
                    config.Field_API_Name__c,
                    config.DeveloperName
                ));
            }
            response.success = true;
        } catch (Exception e) {
            response.success = false;
            response.errorMessage = e.getMessage();
            System.debug('Error in getTriggerTypes: ' + e.getMessage());
        }
        return response;
    }
    
    // Fetch OPTIONS for specific category
    @AuraEnabled
    public static TriggerOptionResponse getTriggerOptions(String category) {
        TriggerOptionResponse response = new TriggerOptionResponse();
        try {
            List<Trigger_Config__mdt> configs = [
                SELECT Label, Value__c
                FROM Trigger_Config__mdt
                WHERE Type__c = 'Option' 
                AND Category__c = :category
                AND IsActive__c = true
                ORDER BY Sort_Order__c ASC, Label ASC
            ];
            
            for (Trigger_Config__mdt config : configs) {
                response.options.add(new OptionWrapper(
                    config.Label,
                    config.Value__c
                ));
            }
            response.success = true;
        } catch (Exception e) {
            response.success = false;
            response.errorMessage = e.getMessage();
            System.debug('Error in getTriggerOptions: ' + e.getMessage());
        }
        return response;
    }
    
    // Save rule with dynamic field mapping
    @AuraEnabled
    public static SaveRuleResponse saveRule(String ruleDataJSON) {
        SaveRuleResponse response = new SaveRuleResponse();
        Savepoint sp = Database.setSavepoint();
        
        try {
            RuleDataWrapper ruleData = (RuleDataWrapper) JSON.deserialize(
                ruleDataJSON, 
                RuleDataWrapper.class
            );
            
            // Validate input
            if (String.isBlank(ruleData.ruleName)) {
                throw new AuraHandledException('Rule name is required');
            }
            
            if (ruleData.quantity == null || ruleData.quantity < 1) {
                throw new AuraHandledException('Valid quantity is required');
            }
            
            // Create rule record
            Rule__c rule = new Rule__c();
            rule.Name = ruleData.ruleName.trim();
            rule.Description__c = String.isNotBlank(ruleData.description) ? 
                                  ruleData.description.trim() : null;
            rule.Case_Type__c = ruleData.caseType;
            rule.Quantity__c = ruleData.quantity;
            rule.Is_Active__c = true;
            
            // Dynamically populate trigger fields
            if (ruleData.triggerOptionsMap != null && !ruleData.triggerOptionsMap.isEmpty()) {
                
                // Get field API names from metadata
                Map<String, String> categoryToFieldMap = getCategoryToFieldMapping();
                
                for (String category : ruleData.triggerOptionsMap.keySet()) {
                    String fieldApiName = categoryToFieldMap.get(category);
                    
                    if (String.isNotBlank(fieldApiName)) {
                        List<String> options = ruleData.triggerOptionsMap.get(category);
                        
                        if (options != null && !options.isEmpty()) {
                            String optionsValue = String.join(options, ';');
                            rule.put(fieldApiName, optionsValue);
                        }
                    }
                }
            }
            
            // Insert rule with FLS check
            if (!Schema.sObjectType.Rule__c.isCreateable()) {
                throw new AuraHandledException('You do not have permission to create rules');
            }
            
            insert rule;
            
            response.success = true;
            response.ruleId = rule.Id;
            response.message = 'Rule "' + rule.Name + '" created successfully!';
            
        } catch (DmlException e) {
            Database.rollback(sp);
            response.success = false;
            response.errorMessage = 'Error saving rule: ' + e.getDmlMessage(0);
            System.debug('DML Error in saveRule: ' + e.getMessage());
        } catch (Exception e) {
            Database.rollback(sp);
            response.success = false;
            response.errorMessage = e.getMessage();
            System.debug('Error in saveRule: ' + e.getMessage() + '\n' + e.getStackTraceString());
        }
        
        return response;
    }
    
    // Helper method to get category to field API name mapping
    private static Map<String, String> getCategoryToFieldMapping() {
        Map<String, String> categoryToFieldMap = new Map<String, String>();
        
        List<Trigger_Config__mdt> configs = [
            SELECT Value__c, Field_API_Name__c 
            FROM Trigger_Config__mdt 
            WHERE Type__c = 'Category'
            AND IsActive__c = true
        ];
        
        for (Trigger_Config__mdt config : configs) {
            categoryToFieldMap.put(config.Value__c, config.Field_API_Name__c);
        }
        
        return categoryToFieldMap;
    }
    
    // ========== WRAPPER CLASSES ==========
    
    public class TriggerTypeResponse {
        @AuraEnabled public Boolean success;
        @AuraEnabled public String errorMessage;
        @AuraEnabled public List<TriggerTypeWrapper> triggerTypes;
        
        public TriggerTypeResponse() {
            this.triggerTypes = new List<TriggerTypeWrapper>();
        }
    }
    
    public class TriggerTypeWrapper {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        @AuraEnabled public String apiName;
        @AuraEnabled public String category;
        
        public TriggerTypeWrapper(String label, String value, String apiName, String category) {
            this.label = label;
            this.value = value;
            this.apiName = apiName;
            this.category = category;
        }
    }
    
    public class TriggerOptionResponse {
        @AuraEnabled public Boolean success;
        @AuraEnabled public String errorMessage;
        @AuraEnabled public List<OptionWrapper> options;
        
        public TriggerOptionResponse() {
            this.options = new List<OptionWrapper>();
        }
    }
    
    public class OptionWrapper {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        
        public OptionWrapper(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }
    
    public class SaveRuleResponse {
        @AuraEnabled public Boolean success;
        @AuraEnabled public String errorMessage;
        @AuraEnabled public String message;
        @AuraEnabled public Id ruleId;
    }
    
    public class RuleDataWrapper {
        public String ruleName;
        public String description;
        public Map<String, List<String>> triggerOptionsMap;
        public String caseType;
        public Integer quantity;
    }
}