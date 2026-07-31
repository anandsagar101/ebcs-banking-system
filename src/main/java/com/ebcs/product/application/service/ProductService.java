package com.ebcs.product.application.service;

import com.ebcs.product.domain.entity.Product;
import com.ebcs.product.dto.CreateProductRequest;
import com.ebcs.product.dto.ProductResponse;
import com.ebcs.product.repository.ProductRepository;
import com.ebcs.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository repo;

    public ProductService(ProductRepository repo) { this.repo = repo; }

    public List<ProductResponse> list() { return repo.findAll().stream().map(this::toResp).toList(); }

    public ProductResponse get(Long id) { return toResp(loadOrThrow(id)); }

    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        Product p = new Product();
        p.setCode(req.code());
        p.setName(req.name());
        p.setProductType(req.productType());
        p.setInterestRate(req.interestRate());
        p.setActive(true);
        return toResp(repo.save(p));
    }

    public Product loadOrThrow(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    private ProductResponse toResp(Product p) {
        return new ProductResponse(p.getId(), p.getCode(), p.getName(), p.getProductType(),
                p.getInterestRate(), p.isActive());
    }
}
