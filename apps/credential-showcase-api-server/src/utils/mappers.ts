import {
  Asset as AssetDTO,
  AssetRequest,
  CredentialDefinition as CredentialDefinitionDTO,
  CredentialSchema as CredentialSchemaDTO,
  IssuanceScenario as IssuanceScenarioDTO,
  Issuer as IssuerDTO,
  Persona as PersonaDTO,
  PresentationScenario as PresentationScenarioDTO,
  RelyingParty as RelyingPartyDTO,
  Showcase as ShowcaseDTO,
  Step as StepDTO,
} from 'credential-showcase-openapi'
import {
  Asset,
  CredentialDefinition,
  CredentialSchema,
  IssuanceScenario,
  Issuer,
  NewAsset,
  NewScenario,
  Persona,
  PresentationScenario,
  RelyingParty,
  Scenario,
  ScenarioType,
  Showcase,
  Step,
} from '../types'

export const newAssetFrom = (asset: AssetRequest): NewAsset => {
  return {
    ...asset,
    content: Buffer.from(asset.content),
  }
}

export const assetDTOFrom = (asset: Asset): AssetDTO => {
  return {
    ...asset,
    fileName: asset.fileName || undefined,
    description: asset.description || undefined,
    content: asset.content.toString(),
  }
}

export const credentialSchemaDTOFrom = (credentialSchema: CredentialSchema): CredentialSchemaDTO => {
  return {
    ...credentialSchema,
    identifierType: credentialSchema.identifierType || undefined,
    identifier: credentialSchema.identifier || undefined,
    source: credentialSchema.source || undefined,
  }
}

export const credentialDefinitionDTOFrom = (credentialDefinition: CredentialDefinition): CredentialDefinitionDTO => {
  return {
    ...credentialDefinition,
    identifierType: credentialDefinition.identifierType || undefined,
    identifier: credentialDefinition.identifier || undefined,
    credentialSchema: credentialSchemaDTOFrom(credentialDefinition.credentialSchema),
    representations: credentialDefinition.representations,
    revocation: credentialDefinition.revocation || undefined,
    icon:
      typeof credentialDefinition.icon === 'string'
        ? { id: credentialDefinition.icon }
        : credentialDefinition.icon
          ? assetDTOFrom(credentialDefinition.icon as Asset)
          : undefined,
  }
}

export const relyingPartyDTOFrom = (relyingParty: RelyingParty): RelyingPartyDTO => {
  return {
    ...relyingParty,
    organization: relyingParty.organization || undefined,
    logo:
      typeof relyingParty.logo === 'string' ? { id: relyingParty.logo } : relyingParty.logo ? assetDTOFrom(relyingParty.logo as Asset) : undefined,
    credentialDefinitions: relyingParty.credentialDefinitions.map(credentialDefinitionDTOFrom),
  }
}

export const issuerDTOFrom = (issuer: Issuer): IssuerDTO => {
  return {
    ...issuer,
    organization: issuer.organization || undefined,
    logo: typeof issuer.logo === 'string' ? { id: issuer.logo } : issuer.logo ? assetDTOFrom(issuer.logo as Asset) : undefined,
    credentialDefinitions: issuer.credentialDefinitions.map(credentialDefinitionDTOFrom),
    credentialSchemas: issuer.credentialSchemas.map(credentialSchemaDTOFrom),
  }
}

export const issuanceScenarioDTOFrom = (issuanceScenario: IssuanceScenario): IssuanceScenarioDTO => {
  if (!issuanceScenario.issuer) {
    throw Error('Missing issuer in issuance scenario')
  }

  return {
    ...issuanceScenario,
    issuer: issuerDTOFrom(issuanceScenario.issuer),
    type: ScenarioType.ISSUANCE,
    steps: issuanceScenario.steps.map(stepDTOFrom),
    personas: issuanceScenario.personas.map(personaDTOFrom),
    bannerImage:
      typeof issuanceScenario.bannerImage === 'string'
        ? { id: issuanceScenario.bannerImage }
        : issuanceScenario.bannerImage
          ? assetDTOFrom(issuanceScenario.bannerImage as Asset)
          : undefined,
  }
}

export const presentationScenarioDTOFrom = (presentationScenario: PresentationScenario): PresentationScenarioDTO => {
  if (!presentationScenario.relyingParty) {
    throw Error('Missing relying party in presentation scenario')
  }

  return {
    ...presentationScenario,
    relyingParty: relyingPartyDTOFrom(presentationScenario.relyingParty),
    type: ScenarioType.PRESENTATION,
    steps: presentationScenario.steps.map(stepDTOFrom),
    personas: presentationScenario.personas.map(personaDTOFrom),
    bannerImage:
      typeof presentationScenario.bannerImage === 'string'
        ? { id: presentationScenario.bannerImage }
        : presentationScenario.bannerImage
          ? assetDTOFrom(presentationScenario.bannerImage as Asset)
          : undefined,
  }
}

export const scenarioDTOFrom = (scenario: Scenario): IssuanceScenarioDTO | PresentationScenarioDTO => {
  switch (scenario.scenarioType) {
    case ScenarioType.PRESENTATION:
      return presentationScenarioDTOFrom(scenario)
    case ScenarioType.ISSUANCE:
      return issuanceScenarioDTOFrom(scenario)
    default:
      throw Error(`Unsupported scenario type ${scenario.scenarioType}`)
  }
}

export const stepDTOFrom = (step: Step): StepDTO => {
  return {
    ...step,
    asset: typeof step.asset === 'string' ? { id: step.asset } : step.asset ? assetDTOFrom(step.asset as Asset) : undefined,
    subScenario: step.subScenario || undefined,
  }
}

export const personaDTOFrom = (persona: Persona): PersonaDTO => {
  return {
    ...persona,
    headshotImage:
      typeof persona.headshotImage === 'string'
        ? { id: persona.headshotImage }
        : persona.headshotImage
          ? assetDTOFrom(persona.headshotImage as Asset)
          : undefined,
    bodyImage:
      typeof persona.bodyImage === 'string' ? { id: persona.bodyImage } : persona.bodyImage ? assetDTOFrom(persona.bodyImage as Asset) : undefined,
    hidden: persona.hidden,
  }
}

export const showcaseDTOFrom = (showcase: Showcase): ShowcaseDTO => {
  return {
    ...showcase,
    personas: showcase.personas.map((persona) => (typeof persona === 'string' ? { id: persona } : personaDTOFrom(persona as Persona))),
    credentialDefinitions: showcase.credentialDefinitions.map((credentialDef) =>
      typeof credentialDef === 'string' ? { id: credentialDef } : credentialDefinitionDTOFrom(credentialDef as CredentialDefinition),
    ),
    scenarios: showcase.scenarios.map((scenario) => (typeof scenario === 'string' ? { id: scenario } : scenarioDTOFrom(scenario as Scenario))),
    bannerImage:
      typeof showcase.bannerImage === 'string'
        ? { id: showcase.bannerImage }
        : showcase.bannerImage
          ? assetDTOFrom(showcase.bannerImage as Asset)
          : undefined,
    completionMessage: showcase.completionMessage || undefined,
  }
}

export const isPresentationScenario = (scenario: Scenario | NewScenario): boolean => {
  return 'relyingParty' in scenario
}

export const isIssuanceScenario = (scenario: Scenario | NewScenario): boolean => {
  return 'issuer' in scenario
}
