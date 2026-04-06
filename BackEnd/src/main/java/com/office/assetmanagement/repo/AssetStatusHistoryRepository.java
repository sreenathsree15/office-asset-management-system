package com.office.assetmanagement.repo;

import com.office.assetmanagement.model.AssetStatusHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetStatusHistoryRepository extends JpaRepository<AssetStatusHistory, Long> {

    List<AssetStatusHistory> findAllByOrderByChangedAtDesc();
}
