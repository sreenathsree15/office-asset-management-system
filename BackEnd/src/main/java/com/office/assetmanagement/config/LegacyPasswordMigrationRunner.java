package com.office.assetmanagement.config;

import com.office.assetmanagement.service.UserAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LegacyPasswordMigrationRunner implements CommandLineRunner {

    private final UserAdminService userAdminService;

    @Override
    public void run(String... args) {
        userAdminService.migrateLegacyPasswords();
    }
}
