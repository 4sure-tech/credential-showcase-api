import { pgEnum } from 'drizzle-orm/pg-core'
import { IdentifierType } from 'credential-showcase-openapi'

export const IdentifierTypePg = pgEnum('IdentifierType', Object.values(IdentifierType) as [string, ...string[]])
