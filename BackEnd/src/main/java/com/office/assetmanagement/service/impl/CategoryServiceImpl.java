package com.office.assetmanagement.service.impl;

import com.office.assetmanagement.model.Category;
import com.office.assetmanagement.repo.CategoryRepository;
import com.office.assetmanagement.service.CategoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<Category> listAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc();
    }
}
