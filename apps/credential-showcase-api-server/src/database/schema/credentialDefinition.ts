import { relations } from 'drizzle-orm';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { assets } from './asset';
import { CredentialTypePg } from './credentialType';
import { credentialAttributes } from './credentialAttribute';
import { credentialRepresentations } from './credentialRepresentation';
import { revocationInfo } from './revocationInfo';
import { relyingPartiesToCredentialDefinitions } from './relyingPartiesToCredentialDefinitions';
import { CredentialType } from '../../types';

export const credentialDefinitions = pgTable('credentialDefinition', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: text().notNull(),
    version: text().notNull(),
    icon: uuid().references(() => assets.id).notNull(),
    type: CredentialTypePg().notNull().$type<CredentialType>()
});

export const credentialDefinitionRelations = relations(credentialDefinitions, ({ one, many }) => ({
    icon: one(assets, {
        fields: [credentialDefinitions.icon],
        references: [assets.id],
    }),
    attributes: many(credentialAttributes),
    representations: many(credentialRepresentations),
    revocation: one(revocationInfo),
    relyingParties: many(relyingPartiesToCredentialDefinitions)
}));
