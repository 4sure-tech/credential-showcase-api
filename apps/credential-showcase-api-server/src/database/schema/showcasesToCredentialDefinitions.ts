import { relations } from 'drizzle-orm';
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { showcases } from './showcase';
import { credentialDefinitions } from './credentialDefinition';

export const showcasesToCredentialDefinitions = pgTable('showcasesToCredentialDefinitions', {
        showcase: uuid().references(() => showcases.id, { onDelete: 'cascade' }).notNull(),
        credentialDefinition: uuid('credential_definition').references(() => credentialDefinitions.id, { onDelete: 'cascade' }).notNull(),
    },
    (t) => [
        primaryKey({ columns: [t.showcase, t.credentialDefinition] })
    ],
);

export const showcasesToCredentialDefinitionsRelations = relations(showcasesToCredentialDefinitions, ({ one }) => ({
    credentialDefinition: one(credentialDefinitions, {
        fields: [showcasesToCredentialDefinitions.credentialDefinition],
        references: [credentialDefinitions.id],
    }),
    showcase: one(showcases, {
        fields: [showcasesToCredentialDefinitions.showcase],
        references: [showcases.id],
    }),
}));
