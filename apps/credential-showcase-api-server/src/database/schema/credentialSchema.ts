import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { IdentifierTypePg } from './identifierType'
import { IdentifierType, OriginType } from '../../types'
import { relations } from 'drizzle-orm'
import { credentialAttributes } from './credentialAttribute'
import { OriginTypePg } from './originType'

export const credentialSchemas = pgTable('credentialSchema', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  identifierType: IdentifierTypePg('identifier_type').$type<IdentifierType>(),
  originType: OriginTypePg('origin_type').$type<OriginType>().default(OriginType.CREATED),
  identifier: text(),
  name: text().notNull(),
  version: text().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const credentialSchemaRelations = relations(credentialSchemas, ({ many }) => ({
  attributes: many(credentialAttributes),
}))
