trigger BookingTriggerMessy on Booking__c (
    before insert,
    after insert,
    before update,
    after update,
    after delete
) {

    // BEFORE INSERT: validation
    if (Trigger.isBefore && Trigger.isInsert) {
        for (Booking__c b : Trigger.new) {
            if (b.Customer_Email__c == null) {
                b.addError('Customer email is required');
            }
            if (b.Status__c == 'Confirmed' && b.Booking_Date__c == null) {
                b.Booking_Date__c = System.today();
            }
        }
    }

    // AFTER INSERT: create Contact, Case, send email, callout
    if (Trigger.isAfter && Trigger.isInsert) {
        for (Booking__c b : Trigger.new) {

            // Upsert Contact
            List<Contact> contacts = [SELECT Id, Email FROM Contact WHERE Email = :b.Customer_Email__c];
            Contact c;
            if (contacts.isEmpty()) {
                c = new Contact(
                    FirstName = b.Customer_First_Name__c,
                    LastName = b.Customer_Last_Name__c,
                    Email = b.Customer_Email__c,
                    Latest_Booking__c = b.Id
                );
                insert c;
            } else {
                c = contacts[0];
                c.Latest_Booking__c = b.Id;
                update c;
            }

            // Link Booking to Contact
            b.Contact__c = c.Id;
            update b;

            // Create Case
            Case cs = new Case(
                Subject = 'Booking created: ' + b.Name,
                ContactId = c.Id,
                Booking__c = b.Id,
                Origin = 'Booking',
                Status = 'New'
            );
            insert cs;

            // Send email
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(new String[] { b.Customer_Email__c });
            email.setSubject('Booking Confirmation');
            email.setPlainTextBody('Your booking ' + b.Name + ' has been received.');
            Messaging.sendEmail(new Messaging.SingleEmailMessage[] { email });

            // External callout (illegal in trigger)
            if (!Test.isRunningTest()) {
                HttpRequest req = new HttpRequest();
                req.setEndpoint('https://example.com/api/booking');
                req.setMethod('POST');
                req.setBody('BookingId=' + b.Id);
                Http http = new Http();
                http.send(req);
            }
        }
    }

    // BEFORE UPDATE: validate status change
    if (Trigger.isBefore && Trigger.isUpdate) {
        for (Booking__c b : Trigger.new) {
            Booking__c oldB = Trigger.oldMap.get(b.Id);
            if (oldB.Status__c != b.Status__c &&
                b.Status__c == 'Cancelled' &&
                b.Customer_Email__c == null) {
                b.addError('Cancelled bookings must have a customer email');
            }
        }
    }

    // AFTER DELETE: log
    if (Trigger.isAfter && Trigger.isDelete) {
        for (Booking__c b : Trigger.old) {
            System.debug('Booking deleted: ' + b.Id);
        }
    }
}