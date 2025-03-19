import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { credentialDefinitions } from './credentialDefinition'
import { stepActions } from './stepAction'

export const credentialRepresentations = pgTable(
  'credentialRepresentation',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    credentialDefinition: uuid('credential_definition')
      .references(() => credentialDefinitions.id, { onDelete: 'cascade' })
      .notNull(),
    stepAction: uuid('step_action_id').references(() => stepActions.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('idx_credential_representations').on(t.credentialDefinition)],
)

export const credentialRepresentationRelations = relations(credentialRepresentations, ({ one }) => ({
  credentialDefinition: one(credentialDefinitions, {
    fields: [credentialRepresentations.credentialDefinition],
    references: [credentialDefinitions.id],
  }),
  stepAction: one(stepActions, {
    fields: [credentialRepresentations.stepAction],
    references: [stepActions.id]
  })
}))
