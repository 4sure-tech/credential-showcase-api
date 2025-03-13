import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { showcasesToCredentialDefinitions } from './showcasesToCredentialDefinitions'
import { showcasesToPersonas } from './showcasesToPersonas'
import { showcaseStatusPg } from './showcaseStatus'
import { ShowcaseStatus } from '../../types'
import { showcasesToScenarios } from './showcasesToScenarios'
import { assets } from './asset'

export const showcases = pgTable(
  'showcase',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    description: text().notNull(),
    completionMessage: text(),
    status: showcaseStatusPg().notNull().$type<ShowcaseStatus>(),
    hidden: boolean().notNull().default(false),
    bannerImage: uuid('banner_image').references(() => assets.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('idx_bannerImage').on(t.bannerImage)],
)

export const showcaseRelations = relations(showcases, ({ many, one }) => ({
  scenarios: many(showcasesToScenarios),
  personas: many(showcasesToPersonas),
  credentialDefinitions: many(showcasesToCredentialDefinitions),
  bannerImage: one(assets, {
    fields: [showcases.bannerImage],
    references: [assets.id],
  }),
}))
