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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "asset")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_name", nullable = false, length = 120)
    private String assetName;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "brand", nullable = false, length = 80)
    private String brand;

    @Column(name = "model_name", nullable = false, length = 80)
    private String model;

    @Column(name = "serial_number", nullable = false, unique = true, length = 100)
    private String serialNumber;

    @Column(name = "batch_id", length = 80)
    private String batchId;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "warranty_expiry_date", nullable = false)
    private LocalDate warrantyExpiryDate;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "assigned_to", length = 120)
    private String assignedTo;

    @Column(name = "section_name", length = 120)
    private String section;

    @Column(name = "seat_number", length = 80)
    private String seatNumber;

    @Column(name = "date_of_issue")
    private LocalDate dateOfIssue;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "expiry_reason", length = 250)
    private String expiryReason;

    @Column(name = "damage_date")
    private LocalDate damageDate;

    @Column(name = "damage_description", length = 500)
    private String damageDescription;

    @Column(name = "damage_severity", length = 30)
    private String damageSeverity;

    @Column(name = "remarks", length = 500)
    private String remarks;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
