import { pgTable, uuid, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { IssuerTypePg } from './issuerType'
import { assets } from './asset'
import { issuersToCredentialDefinitions } from './issuersToCredentialDefinitions'
import { IssuerType } from '../../types'
import { IdentifierTypePg } from './identifierType'
import { IdentifierType } from 'credential-showcase-openapi'

export const issuers = pgTable('issuer', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: text().notNull(),
  type: IssuerTypePg('issuer_type').notNull().$type<IssuerType>(),
  identifierType: IdentifierTypePg('identifier_type').notNull().$type<IdentifierType>(),
  identifier: text().notNull(),
  description: text().notNull(),
  organization: text(),
  logo: uuid().references(() => assets.id),
})

export const issuerRelations = relations(issuers, ({ one, many }) => ({
  credentialDefinitions: many(issuersToCredentialDefinitions),
  credentialSchemas: many(issuersToCredentialDefinitions),
  logo: one(assets, {
    fields: [issuers.logo],
    references: [assets.id],
  }),
}))
