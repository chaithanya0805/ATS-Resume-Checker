package com.example.resumechecker.repository;

import com.example.resumechecker.model.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {
    List<AnalysisResult> findAllByOrderByCreatedAtDesc();

    @Transactional
    @Modifying
    @Query("DELETE FROM AnalysisResult a WHERE a.id = :id")
    int deleteByIdDirectly(@Param("id") Long id);
}
