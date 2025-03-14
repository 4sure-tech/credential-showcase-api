import { ShowcaseExpand } from 'credential-showcase-openapi'

/**
 * Normalizes expand parameters to valid ShowcaseExpand enum values
 *
 * @param expand - Array of expand parameter strings from the request
 * @returns Array of valid ShowcaseExpand enum values
 */
export const normalizeExpandParams = (expand?: string[]): ShowcaseExpand[] => {
  const expandMap: Record<string, ShowcaseExpand> = {
    scenarios: ShowcaseExpand.Scenarios,
    credentialdefinitions: ShowcaseExpand.CredentialDefinitions,
    credential_definitions: ShowcaseExpand.CredentialDefinitions,
    personas: ShowcaseExpand.Personas,
    assetcontent: ShowcaseExpand.AssetContent,
    asset_content: ShowcaseExpand.AssetContent,
  }

  return (
    (expand
      ?.map((exp) => {
        const normalizedKey = exp.toLowerCase().trim()
        if (normalizedKey in expandMap) {
          return expandMap[normalizedKey as keyof typeof expandMap]
        }
        console.warn(`Invalid expand parameter: ${exp}`)
        return null
      })
      .filter(Boolean) as ShowcaseExpand[]) || []
  )
}
