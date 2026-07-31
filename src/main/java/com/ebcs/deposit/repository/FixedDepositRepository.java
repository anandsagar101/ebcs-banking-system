package com.ebcs.deposit.repository;

import com.ebcs.deposit.domain.entity.FixedDeposit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FixedDepositRepository extends JpaRepository<FixedDeposit, Long> {}
