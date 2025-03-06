import { relations } from 'drizzle-orm'
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { scenarios } from './scenario'
import { personas } from './persona'

export const scenariosToPersonas = pgTable(
  'scenariosToPersonas',
  {
    scenario: uuid()
      .references(() => scenarios.id, { onDelete: 'cascade' })
      .notNull(),
    persona: uuid()
      .references(() => personas.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.scenario, t.persona] })],
)

export const scenariosToPersonasRelations = relations(scenariosToPersonas, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [scenariosToPersonas.scenario],
    references: [scenarios.id],
  }),
  persona: one(personas, {
    fields: [scenariosToPersonas.persona],
    references: [personas.id],
  }),
}))
