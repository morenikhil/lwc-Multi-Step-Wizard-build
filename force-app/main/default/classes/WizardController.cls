/**
 * WizardController
 * -----------------------------------------------------------------------------
 * Server-side endpoint for the Multi-Step Wizard demo. Kept intentionally thin:
 * it validates CRUD/FLS, maps the JSON payload to a Contact and inserts it.
 */
public with sharing class WizardController {
    @AuraEnabled
    public static Id createContact(String payload) {
        try {
            if (String.isBlank(payload)) {
                throw new AuraHandledException('No data was supplied.');
            }

            // Enforce object-level security before writing.
            if (!Schema.sObjectType.Contact.isCreateable()) {
                throw new AuraHandledException(
                    'You do not have permission to create Contacts.'
                );
            }

            Map<String, Object> data =
                (Map<String, Object>) JSON.deserializeUntyped(payload);

            Contact record = new Contact(
                FirstName = toStr(data.get('firstName')),
                LastName = toStr(data.get('lastName')),
                Email = toStr(data.get('email')),
                Phone = toStr(data.get('phone')),
                MailingStreet = toStr(data.get('street')),
                MailingCity = toStr(data.get('city')),
                MailingCountry = toStr(data.get('country')),
                // Stored on a standard field so the sample deploys with no custom setup.
                Description = 'Preferred contact method: ' + toStr(data.get('contactMethod')),
                HasOptedOutOfEmail = !toBool(data.get('newsletter'))
            );

            if (String.isBlank(record.LastName)) {
                throw new AuraHandledException('Last Name is required.');
            }

            insert record;
            return record.Id;
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            AuraHandledException ex = new AuraHandledException(e.getMessage());
            ex.setMessage(e.getMessage());
            throw ex;
        }
    }

    private static String toStr(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static Boolean toBool(Object value) {
        return value == null ? false : Boolean.valueOf(value);
    }
}
