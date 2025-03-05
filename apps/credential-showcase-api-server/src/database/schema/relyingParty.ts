import { pgTable, uuid, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { RelyingPartyTypePg } from './relyingPartyType';
import { assets } from './asset';
import { relyingPartiesToCredentialDefinitions } from './relyingPartiesToCredentialDefinitions';
import { RelyingPartyType } from '../../types';

export const relyingParties = pgTable('relyingParty', {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: text().notNull(),
    type: RelyingPartyTypePg().notNull().$type<RelyingPartyType>(),
    description: text().notNull(),
    organization: text(),
    logo: uuid().references(() => assets.id)
});

export const relyingPartyRelations = relations(relyingParties, ({ one, many }) => ({
    cds: many(relyingPartiesToCredentialDefinitions),
    logo: one(assets, {
        fields: [relyingParties.logo],
        references: [assets.id],
    })
}));
