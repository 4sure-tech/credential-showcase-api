import { pgTable, uuid, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { IssuerTypePg } from './issuerType'
import { assets } from './asset'
import { issuersToCredentialDefinitions } from './issuersToCredentialDefinitions'
import { IssuerType } from '../../types'
import { issuersToCredentialSchemas } from './issuersToCredentialSchemas'

export const issuers = pgTable('issuer', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  name: text().notNull(),
  type: IssuerTypePg().notNull().$type<IssuerType>(),
  description: text().notNull(),
  organization: text(),
  logo: uuid().references(() => assets.id),
})

export const issuerRelations = relations(issuers, ({ one, many }) => ({
  cds: many(issuersToCredentialDefinitions),
  css: many(issuersToCredentialSchemas),
  logo: one(assets, {
    fields: [issuers.logo],
    references: [assets.id],
  }),
}))
