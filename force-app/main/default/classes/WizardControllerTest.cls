@isTest
private class WizardControllerTest {
    @isTest
    static void createsContactFromValidPayload() {
        String payload = JSON.serialize(new Map<String, Object>{
            'firstName' => 'Ada',
            'lastName' => 'Lovelace',
            'email' => 'ada@example.com',
            'phone' => '555-0100',
            'street' => '1 Analytical Way',
            'city' => 'London',
            'country' => 'UK',
            'contactMethod' => 'Email',
            'newsletter' => true
        });

        Test.startTest();
        Id recordId = WizardController.createContact(payload);
        Test.stopTest();

        System.assertNotEquals(null, recordId, 'A Contact Id should be returned.');
        Contact created = [
            SELECT FirstName, LastName, Email, MailingCity, HasOptedOutOfEmail
            FROM Contact
            WHERE Id = :recordId
        ];
        System.assertEquals('Ada', created.FirstName);
        System.assertEquals('Lovelace', created.LastName);
        System.assertEquals('London', created.MailingCity);
        System.assertEquals(false, created.HasOptedOutOfEmail, 'Newsletter opt-in clears opt-out.');
    }

    @isTest
    static void blankPayloadThrows() {
        Test.startTest();
        try {
            WizardController.createContact('');
            System.assert(false, 'Expected an exception for blank payload.');
        } catch (AuraHandledException e) {
            System.assert(true);
        }
        Test.stopTest();
    }

    @isTest
    static void missingLastNameThrows() {
        String payload = JSON.serialize(new Map<String, Object>{
            'firstName' => 'NoLastName'
        });

        Test.startTest();
        try {
            WizardController.createContact(payload);
            System.assert(false, 'Expected an exception when Last Name is missing.');
        } catch (AuraHandledException e) {
            System.assert(true);
        }
        Test.stopTest();
    }
}
