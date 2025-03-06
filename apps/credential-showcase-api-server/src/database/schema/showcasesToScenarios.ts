import { relations } from 'drizzle-orm'
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { showcases } from './showcase'
import { scenarios } from './scenario'

export const showcasesToScenarios = pgTable(
  'showcasesToScenarios',
  {
    showcase: uuid()
      .references(() => showcases.id, { onDelete: 'cascade' })
      .notNull(),
    scenario: uuid()
      .references(() => scenarios.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.showcase, t.scenario] })],
)

export const showcasesToScenariosRelations = relations(showcasesToScenarios, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [showcasesToScenarios.scenario],
    references: [scenarios.id],
  }),
  showcase: one(showcases, {
    fields: [showcasesToScenarios.showcase],
    references: [showcases.id],
  }),
}))
