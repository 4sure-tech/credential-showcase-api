import { relations } from 'drizzle-orm'
import { pgTable, integer, text, timestamp, uuid, unique, index } from 'drizzle-orm/pg-core'
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
    screenId: text(),
    order: integer().notNull(),
    type: StepTypePg().notNull().$type<StepType>(),
    subScenario: uuid('sub_scenario').references(() => scenarios.id),
    scenario: uuid()
      .references(() => scenarios.id, { onDelete: 'cascade' })
      .notNull(),
    asset: uuid().references(() => assets.id),
    iconDark: uuid().references(() => assets.id),
    iconLight: uuid().references(() => assets.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      uniqueStepOrder: unique().on(table.order, table.scenario),
      scenarioIndex: index('idx_scenarios_steps').on(table.scenario),
      assetIndex: index('idx_asset_steps').on(table.asset),
      iconDarkIndex: index('idx_icon_dark_steps').on(table.iconDark),
      iconLight: index('idx_icon_light_steps').on(table.iconLight),
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
  iconDark: one(assets, {
    fields: [steps.iconDark],
    references: [assets.id],
  }),
  iconLight: one(assets, {
    fields: [steps.iconLight],
    references: [assets.id],
  }),
}))
