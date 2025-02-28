import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { credentialDefinitions, credentialSchemas } from './credentialDefinition'
import { CredentialAttributeTypePg } from './credentialAttributeType';
import { CredentialAttributeType } from '../../types';

export const credentialAttributes = pgTable('credentialAttribute', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: text().notNull(),
    value: text().notNull(),
    type: CredentialAttributeTypePg('credential_attribute_type').notNull().$type<CredentialAttributeType>(),
    credentialSchema: uuid('credential_schema').references(() => credentialSchemas.id,{ onDelete: 'cascade' }).notNull()
});

export const credentialAttributeRelations = relations(credentialAttributes, ({ one }) => ({
    credentialDefinition: one(credentialDefinitions, {
        fields: [credentialAttributes.credentialSchema],
        references: [credentialDefinitions.id],
    }),
}));
