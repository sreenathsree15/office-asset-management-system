package com.office.assetmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatNumberRequestDto {

    @NotBlank(message = "Seat number is required.")
    private String seatNumber;

    @NotNull(message = "Section is required.")
    @Positive(message = "Section is required.")
    private Long sectionId;

    @Size(max = 500, message = "Description must be 500 characters or fewer.")
    private String description;
}
