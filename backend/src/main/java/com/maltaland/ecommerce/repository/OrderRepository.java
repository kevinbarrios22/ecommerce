package com.maltaland.ecommerce.repository;

import com.maltaland.ecommerce.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByStatus(String status);

    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByCreatedAtAfter(LocalDateTime after);

    long countByStatus(String status);

    Optional<Order> findByStripePaymentIntentId(String stripePaymentIntentId);

    List<Order> findByStatusAndCreatedAtBefore(String status, LocalDateTime createdAt);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.status <> 'CANCELLED'")
    BigDecimal totalRevenue();

    @Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:email IS NULL OR o.user.email LIKE %:email%) AND " +
           "(:start IS NULL OR o.createdAt >= :start) AND " +
           "(:end IS NULL OR o.createdAt <= :end) " +
           "ORDER BY o.createdAt DESC")
    List<Order> findByFilters(@Param("status") String status,
                              @Param("email") String email,
                              @Param("start") LocalDateTime start,
                              @Param("end") LocalDateTime end);
}
