import { relations } from 'drizzle-orm';
import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { showcases } from './showcase';
import { workflows } from './workflow';

export const showcasesToScenarios = pgTable('showcasesToScenarios', {
        showcase: uuid().references(() => showcases.id, { onDelete: 'cascade' }).notNull(),
        scenario: uuid().references(() => workflows.id, { onDelete: 'cascade' }).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
    },
    (t) => [
        primaryKey({ columns: [t.showcase, t.scenario] })
    ],
);

export const showcasesToScenariosRelations = relations(showcasesToScenarios, ({ one }) => ({
    scenario: one(workflows, {
        fields: [showcasesToScenarios.scenario],
        references: [workflows.id],
    }),
    showcase: one(showcases, {
        fields: [showcasesToScenarios.showcase],
        references: [showcases.id],
    }),
}));
