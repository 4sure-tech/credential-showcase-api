import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { credentialDefinitions } from './credentialDefinition'
import { CredentialAttributeTypePg } from './credentialAttributeType'
import { CredentialAttributeType } from '../../types'

export const credentialAttributes = pgTable('credentialAttribute', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: text().notNull(),
  value: text().notNull(),
  type: CredentialAttributeTypePg().notNull().$type<CredentialAttributeType>(),
  credentialDefinition: uuid('credential_definition')
    .references(() => credentialDefinitions.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const credentialAttributeRelations = relations(credentialAttributes, ({ one }) => ({
  credentialDefinition: one(credentialDefinitions, {
    fields: [credentialAttributes.credentialDefinition],
    references: [credentialDefinitions.id],
  }),
}))
