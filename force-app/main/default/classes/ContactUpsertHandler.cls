public class ContactUpsertHandler {
    public static void handle(List<Booking_Change__e> events) {
        Map<String, Contact> existingContacts = new Map<String, Contact>();
        Set<String> emails = new Set<String>();

        for (Booking_Change__e e : events) {
            if (e.CustomerEmail__c != null) emails.add(e.CustomerEmail__c);
        }

        for (Contact c : [SELECT Id, Email FROM Contact WHERE Email IN :emails]) {
            existingContacts.put(c.Email, c);
        }

        List<Contact> contactsToUpsert = new List<Contact>();

        for (Booking_Change__e e : events) {
            Contact c;
            if (existingContacts.containsKey(e.CustomerEmail__c)) {
                c = existingContacts.get(e.CustomerEmail__c);
                c.Latest_Booking__c = (Id)e.BookingId__c;
            } else {
                c = new Contact(
                    FirstName = e.CustomerFirstName__c,
                    LastName = e.CustomerLastName__c,
                    Email = e.CustomerEmail__c,
                    Latest_Booking__c = (Id)e.BookingId__c
                );
            }
            contactsToUpsert.add(c);
        }

        if (!contactsToUpsert.isEmpty()) {
            upsert contactsToUpsert Email;
        }
    }
}