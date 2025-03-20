import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { credentialDefinitions } from './credentialDefinition'
import { credentialSchemas } from './credentialSchema'
import { CredentialRepresentationTypePg } from './credentialRepresentationType'
import { CredentialRepresentationType } from '../../types'

export const credentialRepresentations = pgTable(
  'credentialRepresentation',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    credentialType: CredentialRepresentationTypePg('credential_type').notNull().$type<CredentialRepresentationType>(),
    credentialDefinition: uuid('credential_definition')
      .references(() => credentialDefinitions.id, { onDelete: 'cascade' })
      .notNull(),
    schema: uuid('schema_id').references(() => credentialSchemas.id),
    ocaBundleUrl: text('oca_bundle_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check(
      'credentialRepresentation_type_check',
      sql`
        (credential_type = 'OCA' AND schema_id IS NOT NULL) OR
        (credential_type = 'CREDENTIAL' AND schema_id IS NULL AND oca_bundle_url IS NULL )
    `,
    ),
    index('idx_credential_representations').on(t.credentialDefinition),
  ],
)

export const credentialRepresentationRelations = relations(credentialRepresentations, ({ one }) => ({
  credentialDefinition: one(credentialDefinitions, {
    fields: [credentialRepresentations.credentialDefinition],
    references: [credentialDefinitions.id],
  }),
  schema: one(credentialSchemas, {
    fields: [credentialRepresentations.schema],
    references: [credentialSchemas.id],
  }),
}))
