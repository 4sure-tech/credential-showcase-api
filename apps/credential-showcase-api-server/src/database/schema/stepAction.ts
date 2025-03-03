import { relations } from 'drizzle-orm'
import { pgTable, uuid, text } from 'drizzle-orm/pg-core'
import { steps } from './step'
import { ariesProofRequests } from './ariesProofRequest'
import { StepActionType } from '../../types'

export const stepActions = pgTable('stepAction', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  actionType: text('action_type').notNull().$type<StepActionType>(),
  title: text().notNull(),
  text: text().notNull(),
  step: uuid()
    .references(() => steps.id, { onDelete: 'cascade' })
    .notNull(),
})

export const stepActionRelations = relations(stepActions, ({ one }) => ({
  step: one(steps, {
    fields: [stepActions.step],
    references: [steps.id],
  }),
  proofRequest: one(ariesProofRequests),
}))
