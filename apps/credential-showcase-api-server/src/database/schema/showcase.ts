import { boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { showcasesToCredentialDefinitions } from './showcasesToCredentialDefinitions';
import { showcasesToPersonas } from './showcasesToPersonas';
import { showcaseStatusPg } from './showcaseStatus';
import { ShowcaseStatus } from '../../types';
import { showcasesToScenarios } from './showcasesToScenarios';

export const showcases = pgTable('showcase', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: text().notNull(),
    description: text().notNull(),
    status: showcaseStatusPg().notNull().$type<ShowcaseStatus>(),
    hidden: boolean().notNull(),
});

export const showcaseRelations = relations(showcases, ({ many }) => ({
    scenarios: many(showcasesToScenarios),
    personas: many(showcasesToPersonas),
    credentialDefinitions: many(showcasesToCredentialDefinitions),
}));
