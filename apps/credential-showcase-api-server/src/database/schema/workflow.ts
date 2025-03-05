import { relations, sql } from 'drizzle-orm';
import { check, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { steps } from './step';
import { issuers } from './issuer';
import { workflowsToPersonas } from './workflowsToPersonas';
import { relyingParties } from './relyingParty';
import { WorkflowTypePg } from './workflowType';
import { WorkflowType } from '../../types';

export const workflows = pgTable('workflow', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: text().notNull(),
    description: text().notNull(),
    workflowType: WorkflowTypePg('workflow_type').notNull().$type<WorkflowType>(),
    issuer: uuid().references(() => issuers.id),
    relyingParty: uuid('relying_party').references(() => relyingParties.id),
    },
    () => [
        check('workflow_type_check', sql`
            (workflow_type = 'PRESENTATION' AND relying_party IS NOT NULL) OR
            (workflow_type = 'ISSUANCE' AND issuer IS NOT NULL)
        `)
    ]
)

export const workflowRelations = relations(workflows, ({ one, many }) => ({
    personas: many(workflowsToPersonas),
    steps: many(steps, {
        relationName: 'steps_workflow'
    }),
    issuer: one(issuers, {
        fields: [workflows.issuer],
        references: [issuers.id],
    }),
    relyingParty: one(relyingParties, {
        fields: [workflows.relyingParty],
        references: [relyingParties.id],
    }),
}));
