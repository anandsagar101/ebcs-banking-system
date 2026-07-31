package com.ebcs.transaction;

import com.ebcs.account.application.service.AccountService;
import com.ebcs.account.dto.AccountResponse;
import com.ebcs.account.dto.OpenAccountRequest;
import com.ebcs.customer.application.service.CustomerService;
import com.ebcs.customer.dto.CreateCustomerRequest;
import com.ebcs.customer.dto.CustomerResponse;
import com.ebcs.product.application.service.ProductService;
import com.ebcs.product.domain.entity.ProductType;
import com.ebcs.product.dto.CreateProductRequest;
import com.ebcs.product.dto.ProductResponse;
import com.ebcs.transaction.application.service.TransactionService;
import com.ebcs.transaction.dto.DepositRequest;
import com.ebcs.transaction.dto.TransferRequest;
import com.ebcs.transaction.dto.WithdrawRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TransactionServiceTest {

    @Autowired CustomerService customerService;
    @Autowired ProductService productService;
    @Autowired AccountService accountService;
    @Autowired TransactionService transactionService;

    @Test
    void depositWithdrawTransferFlow() {
        CustomerResponse c1 = customerService.create(new CreateCustomerRequest("A","B","a@b.com","+111"));
        CustomerResponse c2 = customerService.create(new CreateCustomerRequest("C","D","c@d.com","+222"));
        ProductResponse p = productService.create(new CreateProductRequest("SAV1","Savings", ProductType.SAVINGS, new BigDecimal("3.5")));
        AccountResponse a1 = accountService.open(new OpenAccountRequest(c1.id(), p.id()));
        AccountResponse a2 = accountService.open(new OpenAccountRequest(c2.id(), p.id()));

        transactionService.deposit(new DepositRequest(a1.id(), new BigDecimal("1000"), "seed"));
        transactionService.transfer(new TransferRequest(a1.id(), a2.id(), new BigDecimal("300"), "test"));
        transactionService.withdraw(new WithdrawRequest(a2.id(), new BigDecimal("100"), "wd"));

        assertThat(accountService.get(a1.id()).balance()).isEqualByComparingTo("700");
        assertThat(accountService.get(a2.id()).balance()).isEqualByComparingTo("200");
    }
}
