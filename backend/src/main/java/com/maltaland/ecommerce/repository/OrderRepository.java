package com.maltaland.ecommerce.repository;

import com.maltaland.ecommerce.entity.Order;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    List<Order> findByStatus(String status);

    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByCreatedAtAfter(LocalDateTime after);

    long countByStatus(String status);

    Optional<Order> findByStripePaymentIntentId(String stripePaymentIntentId);

    List<Order> findByStatusAndCreatedAtBefore(String status, LocalDateTime createdAt);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.status <> 'CANCELLED'")
    BigDecimal totalRevenue();

    /**
     * Applies only the non-null filters so no null parameters are ever bound to
     * the JDBC statement (avoids PostgreSQL "could not determine data type" /
     * bytea binding errors with Hibernate 6).
     */
    default List<Order> findByFilters(String status, String email, LocalDateTime start, LocalDateTime end) {
        return findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (email != null) {
                predicates.add(cb.like(root.get("user").get("email"), "%" + email + "%"));
            }
            if (start != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), start));
            }
            if (end != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), end));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        }, Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}
