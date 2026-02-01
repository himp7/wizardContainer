public class BookingEventPublisher {
    public static void publish(List<Booking__c> bookings, System.TriggerOperation operation) {
        List<Booking_Change__e> events = new List<Booking_Change__e>();

        for (Booking__c b : bookings) {
            events.add(new Booking_Change__e(
                BookingId__c = b.Id,
                CustomerEmail__c = b.Customer_Email__c,
                CustomerFirstName__c = b.Customer_First_Name__c,
                CustomerLastName__c = b.Customer_Last_Name__c,
                Status__c = b.Status__c,
                TriggerAction__c = String.valueOf(operation)
            ));
        }

        if (!events.isEmpty()) {
            EventBus.publish(events);
        }
    }
}