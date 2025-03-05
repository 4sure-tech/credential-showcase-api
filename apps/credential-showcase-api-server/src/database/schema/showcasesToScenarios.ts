import { relations } from 'drizzle-orm';
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { showcases } from './showcase';
import { workflows } from './workflow';

export const showcasesToScenarios = pgTable('showcasesToScenarios', {
        showcase: uuid().references(() => showcases.id, { onDelete: 'cascade' }).notNull(),
        scenario: uuid().references(() => workflows.id, { onDelete: 'cascade' }).notNull(),
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
