package com.office.assetmanagement.repo;

import com.office.assetmanagement.model.AssetDocument;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssetDocumentRepository extends JpaRepository<AssetDocument, Long> {

    List<AssetDocument> findAllByAssetIdOrderByUploadDateDesc(Long assetId);

    @Query("""
            select d.asset.id as assetId, count(d) as documentCount
            from AssetDocument d
            where d.asset.id in :assetIds
            group by d.asset.id
            """)
    List<AssetDocumentCountProjection> countDocumentsByAssetIds(@Param("assetIds") List<Long> assetIds);
}
