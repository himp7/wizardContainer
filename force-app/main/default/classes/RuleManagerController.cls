public with sharing class RuleManagerController {
    
    @AuraEnabled(cacheable=true)
    public static List<Rule__c> getRules() {
        try {
            return [
                SELECT Id, Name, Description__c, Case_Type__c, Quantity__c, 
                       Is_Active__c, Account_Type__c, Industry__c, Region__c,
                       CreatedDate, LastModifiedDate
                FROM Rule__c
                ORDER BY CreatedDate DESC
                LIMIT 100
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving rules: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static Rule__c getRule(Id ruleId) {
        try {
            return [
                SELECT Id, Name, Description__c, Case_Type__c, Quantity__c, 
                       Is_Active__c, Account_Type__c, Industry__c, Region__c
                FROM Rule__c
                WHERE Id = :ruleId
                LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving rule: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void deleteRule(Id ruleId) {
        try {
            Rule__c rule = [SELECT Id FROM Rule__c WHERE Id = :ruleId LIMIT 1];
            delete rule;
        } catch (Exception e) {
            throw new AuraHandledException('Error deleting rule: ' + e.getMessage());
        }
    }
}