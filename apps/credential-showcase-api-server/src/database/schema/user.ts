import { pgTable, text } from 'drizzle-orm/pg-core'
import { timestamp, uuid } from 'drizzle-orm/pg-core'
import { IdentifierTypePg } from './identifierType'
import { IdentifierType } from '../../types'

export const users = pgTable('user', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  identifierType: IdentifierTypePg('identifier_type').$type<IdentifierType>(),
  identifier: text('identifier'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})
