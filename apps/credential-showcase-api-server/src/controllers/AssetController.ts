import {
    Body,
    Delete,
    Get,
    HttpCode,
    JsonController,
    OnUndefined,
    Param,
    Post,
    Put
} from 'routing-controllers';
import { Service } from 'typedi';
import {
    AssetResponse,
    AssetResponseFromJSONTyped,
    AssetRequest,
    AssetsResponse,
    AssetsResponseFromJSONTyped
} from 'credential-showcase-openapi';
import AssetService from '../services/AssetService';
import { assetDTOFrom, newAssetFrom } from '../utils/mappers';

@JsonController('/assets')
@Service()
class AssetController {
    constructor(private assetService: AssetService) { }

    @Get('/')
    public async getAll(): Promise<AssetsResponse> {
        const result = await this.assetService.getAssets()
        const assets = result.map(asset => assetDTOFrom(asset))
        return AssetsResponseFromJSONTyped({ assets }, false)
    }

    @Get('/:id')
    public async getOne(@Param('id') id: string): Promise<AssetResponse> {
        const result = await this.assetService.getAsset(id);
        return AssetResponseFromJSONTyped({ asset: assetDTOFrom(result) }, false)
    }

    @HttpCode(201)
    @Post('/')
    public async post(@Body() assetRequest: AssetRequest): Promise<AssetResponse> {
        const result = await this.assetService.createAsset(newAssetFrom(assetRequest));
        return AssetResponseFromJSONTyped({ asset: assetDTOFrom(result) }, false)
    }

    @Put('/:id')
    public async put(@Param('id') id: string, @Body() assetRequest: AssetRequest): Promise<AssetResponse> {
        const result = await this.assetService.updateAsset(id, newAssetFrom(assetRequest))
        return AssetResponseFromJSONTyped({ asset: assetDTOFrom(result) }, false)
    }

    @OnUndefined(204)
    @Delete('/:id')
    public async delete(@Param('id') id: string): Promise<void> {
        return this.assetService.deleteAsset(id);
    }
}

export default AssetController
