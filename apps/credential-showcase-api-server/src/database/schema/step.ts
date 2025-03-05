import { relations } from 'drizzle-orm';
import { pgTable, integer, text, uuid, unique } from 'drizzle-orm/pg-core';
import { StepTypePg } from './stepType';
import { workflows } from './workflow';
import { stepActions } from './stepAction';
import { assets } from './asset';
import { StepType } from '../../types';

export const steps = pgTable('step', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    title: text().notNull(),
    description: text().notNull(),
    order: integer().notNull(),
    type: StepTypePg().notNull().$type<StepType>(),
    subFlow: uuid('sub_flow').references(() => workflows.id),
    workflow: uuid().references(() => workflows.id,{ onDelete: 'cascade' }).notNull(),
    asset: uuid().references(() => assets.id)
}, (table) => {
    return {
        uniqueStepOrder: unique().on(table.order, table.workflow)
    };
});

export const stepRelations = relations(steps, ({ one, many }) => ({
    subFlow: one(workflows, {
        fields: [steps.subFlow],
        references: [workflows.id],
    }),
    actions: many(stepActions),
    workflow: one(workflows, {
        fields: [steps.workflow],
        references: [workflows.id],
        relationName: 'steps_workflow',
    }),
    asset: one(assets, {
        fields: [steps.asset],
        references: [assets.id],
    }),
}));
