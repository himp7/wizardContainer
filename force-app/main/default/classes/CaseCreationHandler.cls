public class CaseCreationHandler {
    public static void handle(List<Booking_Change__e> events) {
        List<Case> casesToInsert = new List<Case>();

        for (Booking_Change__e e : events) {
            if (e.TriggerAction__c == 'AFTER_INSERT') {
                Contact c = [SELECT Id FROM Contact WHERE Email = :e.CustomerEmail__c LIMIT 1];
                casesToInsert.add(new Case(
                    Subject = 'Booking created: ' + e.BookingId__c,
                    ContactId = c.Id,
                    Booking__c = (Id)e.BookingId__c,
                    Origin = 'Booking',
                    Status = 'New'
                ));
            }
        }

        if (!casesToInsert.isEmpty()) {
            insert casesToInsert;
        }
    }
}