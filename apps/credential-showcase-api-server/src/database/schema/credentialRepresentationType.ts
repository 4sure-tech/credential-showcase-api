import { pgEnum } from 'drizzle-orm/pg-core'
import { CredentialRepresentationType } from '../../types'

export const CredentialRepresentationTypePg = pgEnum(
  'CredentialRepresentationType',
  Object.values(CredentialRepresentationType) as [string, ...string[]],
)
