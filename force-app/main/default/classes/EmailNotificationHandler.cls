public class EmailNotificationHandler {
    public static void handle(List<Booking_Change__e> events) {
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

        for (Booking_Change__e e : events) {
            if (e.TriggerAction__c == 'AFTER_INSERT') { 
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                email.setToAddresses(new String[] { e.CustomerEmail__c });
                email.setSubject('Booking Confirmation');
                email.setPlainTextBody('Your booking ' + e.BookingId__c + ' has been received.');
                emails.add(email);
            }
        }

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }
}