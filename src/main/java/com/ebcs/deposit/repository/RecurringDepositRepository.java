package com.ebcs.deposit.repository;

import com.ebcs.deposit.domain.entity.RecurringDeposit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecurringDepositRepository extends JpaRepository<RecurringDeposit, Long> {}
