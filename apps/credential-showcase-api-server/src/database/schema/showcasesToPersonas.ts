import { relations } from 'drizzle-orm';
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { showcases } from './showcase';
import { personas } from './persona';

export const showcasesToPersonas = pgTable('showcasesToPersonas', {
        showcase: uuid().references(() => showcases.id, { onDelete: 'cascade' }).notNull(),
        persona: uuid().references(() => personas.id, { onDelete: 'cascade' }).notNull(),
    },
    (t) => [
        primaryKey({ columns: [t.showcase, t.persona] })
    ],
);

export const showcasesToPersonasRelations = relations(showcasesToPersonas, ({ one }) => ({
    persona: one(personas, {
        fields: [showcasesToPersonas.persona],
        references: [personas.id],
    }),
    showcase: one(showcases, {
        fields: [showcasesToPersonas.showcase],
        references: [showcases.id],
    }),
}));
