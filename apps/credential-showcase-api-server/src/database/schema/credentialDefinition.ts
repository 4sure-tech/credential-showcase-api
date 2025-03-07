import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { assets } from './asset'
import { CredentialTypePg } from './credentialType'
import { credentialRepresentations } from './credentialRepresentation'
import { revocationInfo } from './revocationInfo'
import { relyingPartiesToCredentialDefinitions } from './relyingPartiesToCredentialDefinitions'
import { CredentialType } from '../../types'
import { credentialSchemas } from './credentialSchema'
import { IdentifierTypePg } from './identifierType'
import { IdentifierType } from 'credential-showcase-openapi'

export const credentialDefinitions = pgTable('credentialDefinition', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: text().notNull(),
  version: text().notNull(),
  identifierType: IdentifierTypePg('identifier_type').notNull().$type<IdentifierType>(),
  identifier: text().notNull(),
  credentialSchema: uuid('credential_schema')
    .references(() => credentialSchemas.id)
    .notNull(),
  icon: uuid()
    .references(() => assets.id)
    .notNull(),
  type: CredentialTypePg().notNull().$type<CredentialType>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const credentialDefinitionRelations = relations(credentialDefinitions, ({ one, many }) => ({
  cs: one(credentialSchemas, {
    fields: [credentialDefinitions.credentialSchema],
    references: [credentialSchemas.id],
  }),
  icon: one(assets, {
    fields: [credentialDefinitions.icon],
    references: [assets.id],
  }),
  representations: many(credentialRepresentations),
  revocation: one(revocationInfo),
  relyingParties: many(relyingPartiesToCredentialDefinitions),
}))
