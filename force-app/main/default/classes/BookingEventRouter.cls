public class BookingEventRouter {
    public static void route(List<Booking_Change__e> events) {
        ContactUpsertHandler.handle(events);
        CaseCreationHandler.handle(events);
        EmailNotificationHandler.handle(events);
        ExternalIntegrationHandler.handle(events);
        //DeleteAuditHandler.handle(events);
    }
}