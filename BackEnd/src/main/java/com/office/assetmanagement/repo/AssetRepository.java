package com.office.assetmanagement.repo;

import com.office.assetmanagement.model.Asset;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    boolean existsByAssetNameIgnoreCase(String assetName);

    boolean existsByAssetNameIgnoreCaseAndIdNot(String assetName, Long id);

    boolean existsBySerialNumberIgnoreCase(String serialNumber);

    boolean existsBySerialNumberIgnoreCaseAndIdNot(String serialNumber, Long id);

    java.util.List<Asset> findAllByOrderByUpdatedAtDesc();

    List<Asset> findAllByStatusNotIgnoreCaseOrderByUpdatedAtDesc(String status);

    List<Asset> findAllByStatusIgnoreCaseOrderByUpdatedAtDesc(String status);

    List<Asset> findAllByStatusInOrderByUpdatedAtDesc(List<String> statuses);

    Optional<Asset> findByIdAndStatusIgnoreCase(Long id, String status);

    Optional<Asset> findByIdAndStatusIn(Long id, List<String> statuses);

    long countByStatusIgnoreCase(String status);

    long countByStatusNotIgnoreCase(String status);
}
