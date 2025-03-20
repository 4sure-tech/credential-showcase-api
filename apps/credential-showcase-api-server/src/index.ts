import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import Container from 'typedi'

import { ExpressErrorHandler } from './middleware/ExpressErrorHandler'
import AssetController from './controllers/AssetController'
import PersonaController from './controllers/PersonaController'
import RelyingPartyController from './controllers/RelyingPartyController'
import IssuerController from './controllers/IssuerController'
import IssuanceScenarioController from './controllers/IssuanceScenarioController'
import PresentationScenarioController from './controllers/PresentationScenarioController'
import ShowcaseController from './controllers/ShowcaseController'
import { CredentialDefinitionController } from './controllers/CredentialDefinitionController'
import { CredentialSchemaController } from './controllers/CredentialSchemaController'

const allowedOrigins = process.env.ALLOW_ORIGINS?.split(',') ?? ['*']
const methods = process.env.ALLOW_METHODS?.split(',') ?? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
const allowedHeaders = process.env.ALLOW_HEADERS?.split(',') ?? ['Content-Type', 'Authorization', 'X-Requested-With']
const credentials = process.env.ALLOW_CREDENTIALS === 'true'

require('dotenv-flow').config()
useContainer(Container)

async function bootstrap() {
  try {
    const corsOptions = {
      origin: (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!requestOrigin) return callback(null, true)
        if (allowedOrigins.indexOf(requestOrigin) === -1) {
          const msg = 'The CORS policy for this site does not allow access from the specified Origin.'
          return callback(new Error(msg), false)
        }
        return callback(null, true)
      },
      methods,
      allowedHeaders,
      credentials,
    }

    // Create and configure Express server
    const app = createExpressServer({
      controllers: [
        AssetController,
        PersonaController,
        CredentialSchemaController,
        CredentialDefinitionController,
        RelyingPartyController,
        IssuerController,
        IssuanceScenarioController,
        PresentationScenarioController,
        ShowcaseController,
      ],
      middlewares: [ExpressErrorHandler],
      defaultErrorHandler: false,
      cors: corsOptions,
    })
    // Start the server
    const port = Number(process.env.PORT)

    app.listen(port, (): void => {
      console.log(`Server is running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start application:', error)
    process.exit(1)
  }
}

// Start the application
void bootstrap()
