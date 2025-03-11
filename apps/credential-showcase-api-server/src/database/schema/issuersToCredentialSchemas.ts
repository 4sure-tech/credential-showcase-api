import { relations } from 'drizzle-orm'
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { issuers } from './issuer'
import { credentialSchemas } from './credentialSchema'

export const issuersToCredentialSchemas = pgTable(
  'issuersToCredentialSchemas',
  {
    issuer: uuid()
      .references(() => issuers.id, { onDelete: 'cascade' })
      .notNull(),
    credentialSchema: uuid('credential_schema')
      .references(() => credentialSchemas.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.issuer, t.credentialSchema] })],
)

export const issuersToCredentialSchemasRelations = relations(issuersToCredentialSchemas, ({ one }) => ({
  cs: one(credentialSchemas, {
    fields: [issuersToCredentialSchemas.credentialSchema],
    references: [credentialSchemas.id],
  }),
  issuer: one(issuers, {
    fields: [issuersToCredentialSchemas.issuer],
    references: [issuers.id],
  }),
}))
