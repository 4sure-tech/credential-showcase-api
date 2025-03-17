import 'reflect-metadata';
import { createExpressServer, useContainer } from 'routing-controllers';
import Container from 'typedi';

import { ExpressErrorHandler } from './middleware/ExpressErrorHandler';
import AssetController from './controllers/AssetController';
import PersonaController from './controllers/PersonaController';
import RelyingPartyController from './controllers/RelyingPartyController';
import IssuerController from './controllers/IssuerController';
import IssuanceScenarioController from './controllers/IssuanceScenarioController';
import PresentationScenarioController from './controllers/PresentationScenarioController';
import ShowcaseController from './controllers/ShowcaseController';
import { CredentialDefinitionController } from './controllers/CredentialDefinitionController';
import { CredentialSchemaController } from './controllers/CredentialSchemaController';
import cors from 'cors';
require('dotenv-flow').config();

useContainer(Container);

async function bootstrap() {
  try {
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
    });

    const allowedOrigins = [
        'https://bcshowcase-ui.dev.nborbit.ca'
    ];

    app.use(cors({
        origin: function (origin, callback) {
          console.log("Request Origin:", origin); 

            if (!origin) return callback(null, true);

            if (allowedOrigins.indexOf(origin) === -1) {
                const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"], 
        credentials: true, 
    }));

    const port = 3001; 

    app.listen(port, (): void => {
        console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
      console.error('Failed to start application:', error);
      process.exit(1);
  }
}

bootstrap();