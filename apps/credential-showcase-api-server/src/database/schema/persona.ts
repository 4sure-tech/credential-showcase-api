import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { assets } from './asset'
import { relations } from 'drizzle-orm'

export const personas = pgTable('persona', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text().notNull(),
  role: text().notNull(),
  description: text().notNull(),
  headshotImage: uuid('headshot_image').references(() => assets.id),
  bodyImage: uuid('body_image').references(() => assets.id),
})

export const personaRelations = relations(personas, ({ one }) => ({
  headshotImage: one(assets, {
    fields: [personas.headshotImage],
    references: [assets.id],
  }),
  bodyImage: one(assets, {
    fields: [personas.bodyImage],
    references: [assets.id],
  }),
}))
