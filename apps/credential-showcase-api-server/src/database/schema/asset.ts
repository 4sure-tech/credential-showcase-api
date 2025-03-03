import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { customBytea } from '../customTypes/pg'
import { relations } from 'drizzle-orm'
import { personas } from './persona'

export const assets = pgTable('asset', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  mediaType: text('media_type').notNull(),
  fileName: text('file_name'),
  description: text(),
  content: customBytea().notNull(),
})

export const assetRelations = relations(assets, ({ many }) => ({
  personas: many(personas),
}))
