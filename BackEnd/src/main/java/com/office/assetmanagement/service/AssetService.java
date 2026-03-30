package com.office.assetmanagement.service;

import com.office.assetmanagement.asset.dto.AssetBulkDto;
import com.office.assetmanagement.asset.dto.AssetSingleDto;
import com.office.assetmanagement.model.Asset;
import java.util.List;

public interface AssetService {

    Asset createSingleAsset(AssetSingleDto assetSingleDto);

    List<Asset> createBulkAssets(AssetBulkDto assetBulkDto);
}
