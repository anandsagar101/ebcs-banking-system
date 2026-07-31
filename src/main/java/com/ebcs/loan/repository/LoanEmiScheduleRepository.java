package com.ebcs.loan.repository;

import com.ebcs.loan.domain.entity.LoanEmiSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanEmiScheduleRepository extends JpaRepository<LoanEmiSchedule, Long> {
    List<LoanEmiSchedule> findByLoanIdOrderByInstallmentNoAsc(Long loanId);
}
