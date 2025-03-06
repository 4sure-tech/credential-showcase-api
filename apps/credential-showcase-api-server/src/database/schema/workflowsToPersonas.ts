import { relations } from 'drizzle-orm';
import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { workflows } from './workflow';
import { personas } from './persona';

export const workflowsToPersonas = pgTable('workflowsToPersonas', {
        workflow: uuid().references(() => workflows.id, { onDelete: 'cascade' }).notNull(),
        persona: uuid().references(() => personas.id, { onDelete: 'cascade' }).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
    },
    (t) => [
        primaryKey({ columns: [t.workflow, t.persona] })
    ],
);

export const workflowsToPersonasRelations = relations(workflowsToPersonas, ({ one }) => ({
    workflow: one(workflows, {
        fields: [workflowsToPersonas.workflow],
        references: [workflows.id],
    }),
    persona: one(personas, {
        fields: [workflowsToPersonas.persona],
        references: [personas.id],
    }),
}));
