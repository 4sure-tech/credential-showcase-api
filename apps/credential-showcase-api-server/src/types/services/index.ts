import { NewShowcase, ShowcaseExpand } from '../schema'

export type GetShowcasesParams = {
  expand?: ShowcaseExpand[]
}

export type GetShowcaseParams = {
  id: string
  expand?: ShowcaseExpand[]
}

export type CreateShowcaseParams = {
  showcase: NewShowcase
}

export type UpdateShowcaseParams = {
  id: string
  showcase: NewShowcase
}

export type DeleteShowcaseParams = {
  id: string
}

export type GetIdBySlugParams = {
  slug: string
}
