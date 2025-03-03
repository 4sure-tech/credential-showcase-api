import { relations } from 'drizzle-orm'
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { issuers } from './issuer'
import { credentialDefinitions } from './credentialDefinition'

export const issuersToCredentialDefinitions = pgTable(
  'issuersToCredentialDefinitions',
  {
    issuer: uuid()
      .references(() => issuers.id, { onDelete: 'cascade' })
      .notNull(),
    credentialDefinition: uuid('credential_definition')
      .references(() => credentialDefinitions.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.issuer, t.credentialDefinition] })],
)

export const issuersToCredentialDefinitionsRelations = relations(issuersToCredentialDefinitions, ({ one }) => ({
  cd: one(credentialDefinitions, {
    fields: [issuersToCredentialDefinitions.credentialDefinition],
    references: [credentialDefinitions.id],
  }),
  issuer: one(issuers, {
    fields: [issuersToCredentialDefinitions.issuer],
    references: [issuers.id],
  }),
}))
