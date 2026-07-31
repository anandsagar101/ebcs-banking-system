package com.ebcs.customer.mapper;

import com.ebcs.customer.domain.entity.Customer;
import com.ebcs.customer.dto.CustomerResponse;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {
    public CustomerResponse toResponse(Customer c) {
        return new CustomerResponse(c.getId(), c.getFirstName(), c.getLastName(), c.getEmail(),
                c.getPhone(), c.getKycStatus(), c.getCreatedAt());
    }
}
