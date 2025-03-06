import { relations } from 'drizzle-orm'
import { pgTable, integer, text, uuid, unique } from 'drizzle-orm/pg-core'
import { StepTypePg } from './stepType'
import { scenarios } from './scenario'
import { stepActions } from './stepAction'
import { assets } from './asset'
import { StepType } from '../../types'

export const steps = pgTable(
  'step',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    title: text().notNull(),
    description: text().notNull(),
    order: integer().notNull(),
    type: StepTypePg().notNull().$type<StepType>(),
    subScenario: uuid('sub_scenario').references(() => scenarios.id),
    scenario: uuid()
      .references(() => scenarios.id, { onDelete: 'cascade' })
      .notNull(),
    asset: uuid().references(() => assets.id),
  },
  (table) => {
    return {
      uniqueStepOrder: unique().on(table.order, table.scenario),
    }
  },
)

export const stepRelations = relations(steps, ({ one, many }) => ({
  subScenario: one(scenarios, {
    fields: [steps.subScenario],
    references: [scenarios.id],
  }),
  actions: many(stepActions),
  scenario: one(scenarios, {
    fields: [steps.scenario],
    references: [scenarios.id],
    relationName: 'steps_scenario',
  }),
  asset: one(assets, {
    fields: [steps.asset],
    references: [assets.id],
  }),
}))
