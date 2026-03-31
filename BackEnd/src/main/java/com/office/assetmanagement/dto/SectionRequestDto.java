package com.office.assetmanagement.dto;

import jakarta.validation.constraints.NotBlank;
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
public class SectionRequestDto {

    @NotBlank(message = "Section name is required.")
    private String sectionName;

    @Size(max = 60, message = "Section code must be 60 characters or fewer.")
    private String sectionCode;

    @Size(max = 500, message = "Description must be 500 characters or fewer.")
    private String description;
}
