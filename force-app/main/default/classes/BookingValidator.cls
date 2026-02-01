public class BookingValidator {
    public static void validate(List<Booking__c> newList, Map<Id, Booking__c> oldMap) {
        for (Booking__c b : newList) {

            if (b.Customer_Email__c == null) {
                b.addError('Customer email is required');
            }

            if (Trigger.isInsert && b.Status__c == 'Confirmed' && b.Booking_Date__c == null) {
                b.Booking_Date__c = Date.today();
            }

            if (oldMap != null && oldMap.containsKey(b.Id)) {
                Booking__c oldB = oldMap.get(b.Id);
                if (oldB.Status__c != b.Status__c &&
                    b.Status__c == 'Cancelled' &&
                    b.Customer_Email__c == null) {
                    b.addError('Cancelled bookings must have a customer email');
                }
            }
        }
    }
}