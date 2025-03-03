import { pgEnum } from 'drizzle-orm/pg-core'
import { WorkflowType } from '../../types'

export const WorkflowTypePg = pgEnum('WorkflowType', Object.values(WorkflowType) as [string, ...string[]])
