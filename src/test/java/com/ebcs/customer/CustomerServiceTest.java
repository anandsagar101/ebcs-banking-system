package com.ebcs.customer;

import com.ebcs.customer.application.service.CustomerService;
import com.ebcs.customer.dto.CreateCustomerRequest;
import com.ebcs.customer.dto.CustomerResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CustomerServiceTest {

    @Autowired
    CustomerService customerService;

    @Test
    void createCustomer_success() {
        CustomerResponse resp = customerService.create(
                new CreateCustomerRequest("John", "Doe", "john.doe@example.com", "+15551234567"));
        assertThat(resp.id()).isNotNull();
        assertThat(resp.email()).isEqualTo("john.doe@example.com");
    }
}
