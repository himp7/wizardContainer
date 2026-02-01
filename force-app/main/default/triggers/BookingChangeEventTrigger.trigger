trigger BookingChangeEventTrigger
on Booking_Change__e (after insert) {

    BookingEventRouter.route(Trigger.new);
}