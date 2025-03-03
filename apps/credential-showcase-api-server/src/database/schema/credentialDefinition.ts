import { relations } from 'drizzle-orm'
import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { assets } from './asset'
import { CredentialTypePg } from './credentialType'
import { credentialRepresentations } from './credentialRepresentation'
import { revocationInfo } from './revocationInfo'
import { relyingPartiesToCredentialDefinitions } from './relyingPartiesToCredentialDefinitions'
import { CredentialType } from '../../types'
import { issuers } from './issuer'
import { credentialSchemas } from './credentialSchema'

export const credentialDefinitions = pgTable('credentialDefinition', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: text().notNull(),
  version: text().notNull(),
  issuerId: uuid()
    .references(() => issuers.id)
    .notNull(),
  credentialSchemaId: uuid()
    .references(() => credentialSchemas.id)
    .notNull(),
  icon: uuid()
    .references(() => assets.id)
    .notNull(),
  type: CredentialTypePg('credential_type').notNull().$type<CredentialType>(),
})

export const credentialDefinitionRelations = relations(credentialDefinitions, ({ one, many }) => ({
  credentialSchema: one(credentialSchemas, {
    fields: [credentialDefinitions.credentialSchemaId],
    references: [credentialSchemas.id]
  }),
  icon: one(assets, {
    fields: [credentialDefinitions.icon],
    references: [assets.id],
  }),
  representations: many(credentialRepresentations),
  revocation: one(revocationInfo),
  relyingParties: many(relyingPartiesToCredentialDefinitions),
}))
