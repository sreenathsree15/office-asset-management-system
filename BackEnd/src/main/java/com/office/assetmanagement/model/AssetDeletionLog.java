package com.office.assetmanagement.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "asset_deletion_log")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetDeletionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @Column(name = "deletion_reason", length = 500)
    private String reason;

    @Column(name = "deleted_by", nullable = false, length = 120)
    private String deletedBy;

    @Column(name = "deletion_date", nullable = false)
    private LocalDateTime deletionDate;

    @Column(name = "restored_by", length = 120)
    private String restoredBy;

    @Column(name = "restored_at")
    private LocalDateTime restoredAt;

    @PrePersist
    void onCreate() {
        if (deletionDate == null) {
            deletionDate = LocalDateTime.now();
        }
    }
}
