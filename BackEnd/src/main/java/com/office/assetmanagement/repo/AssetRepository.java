package com.office.assetmanagement.repo;

import com.office.assetmanagement.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    boolean existsBySerialNumberIgnoreCase(String serialNumber);
}
