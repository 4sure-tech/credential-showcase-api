import { pgTable, uuid, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { credentialDefinitions } from './credentialDefinition'

export const revocationInfo = pgTable('revocationInfo', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  title: text().notNull(),
  description: text().notNull(),
  credentialDefinition: uuid('credential_definition')
    .references(() => credentialDefinitions.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
})

export const revocationInfoRelations = relations(revocationInfo, ({ one }) => ({
  credentialDefinition: one(credentialDefinitions, {
    fields: [revocationInfo.credentialDefinition],
    references: [credentialDefinitions.id],
  }),
}))
