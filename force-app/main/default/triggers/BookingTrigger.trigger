trigger BookingTrigger on Booking__c (
    before insert,
    before update,
    after insert,
    after update,
    after delete
) {

    // BEFORE: validation only
    if (Trigger.isBefore) {
        BookingValidator.validate(Trigger.new, Trigger.oldMap);
    }

    // AFTER: publish PE
    if (Trigger.isAfter) {
        BookingEventPublisher.publish(
            Trigger.isDelete ? Trigger.old : Trigger.new,
            Trigger.operationType
        );
    }
}