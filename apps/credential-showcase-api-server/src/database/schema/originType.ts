import { pgEnum } from 'drizzle-orm/pg-core'
import { OriginType } from '../../types'

export const OriginTypePg = pgEnum('OriginType', Object.values(OriginType) as [string, ...string[]])
