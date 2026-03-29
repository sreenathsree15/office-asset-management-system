package com.office.assetmanagement.repo;

import com.office.assetmanagement.model.UserAdmin;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAdminRepository extends JpaRepository<UserAdmin, Integer> {

    Optional<UserAdmin> findByUsernameAndDeleteStatus(String username, String deleteStatus);

    List<UserAdmin> findAllByDeleteStatus(String deleteStatus);
}
