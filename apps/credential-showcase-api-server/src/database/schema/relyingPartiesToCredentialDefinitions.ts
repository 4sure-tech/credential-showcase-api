import { relations } from 'drizzle-orm'
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { relyingParties } from './relyingParty'
import { credentialDefinitions } from './credentialDefinition'

export const relyingPartiesToCredentialDefinitions = pgTable(
  'relyingPartiesToCredentialDefinitions',
  {
    relyingParty: uuid('relying_party')
      .references(() => relyingParties.id, { onDelete: 'cascade' })
      .notNull(),
    credentialDefinition: uuid('credential_definition')
      .references(() => credentialDefinitions.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.relyingParty, t.credentialDefinition] })],
)

export const relyingPartiesToCredentialDefinitionsRelations = relations(relyingPartiesToCredentialDefinitions, ({ one }) => ({
  cd: one(credentialDefinitions, {
    fields: [relyingPartiesToCredentialDefinitions.credentialDefinition],
    references: [credentialDefinitions.id],
  }),
  rp: one(relyingParties, {
    fields: [relyingPartiesToCredentialDefinitions.relyingParty],
    references: [relyingParties.id],
  }),
}))
