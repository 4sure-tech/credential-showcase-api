import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { IdentifierTypePg } from './identifierType'
import { IdentifierType } from '../../types'
import { relations } from 'drizzle-orm'
import { credentialAttributes } from './credentialAttribute'

export const credentialSchemas = pgTable('credentialSchema', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  identifierType: IdentifierTypePg('identifier_type').notNull().$type<IdentifierType>(),
  identifier: text().notNull(),
  name: text().notNull(),
  version: text().notNull(),
})

export const credentialSchemaRelations = relations(credentialSchemas, ({ one, many }) => ({
  attributes: many(credentialAttributes),
}))
