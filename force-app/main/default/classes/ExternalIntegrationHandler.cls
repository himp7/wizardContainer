public class ExternalIntegrationHandler {

    // Called by router
    public static void handle(List<Booking_Change__e> events) {
        List<String> jsonEvents = new List<String>();
        for (Booking_Change__e e : events) {
            jsonEvents.add(JSON.serialize(e));
        }

        // Send serialized data to @future method
        asyncCallout(jsonEvents);
    }

    @future(callout=true)
    public static void asyncCallout(List<String> serializedEvents) {
        Http http = new Http();

        for (String jsonStr : serializedEvents) {
            Booking_Change__e e = (Booking_Change__e) JSON.deserialize(jsonStr, Booking_Change__e.class);

            HttpRequest req = new HttpRequest();
req.setEndpoint('https://webhook.site/4bb96a06-dc74-4d3d-9c0b-83c2125731a2');
req.setMethod('POST');
req.setHeader('Content-Type','application/json');
req.setBody(JSON.serialize(new Map<String,Object>{
    'BookingId' => e.BookingId__c
    //'CustomerEmail' => e.Customer_Email__c
}));
http.send(req);

        }
    }
}