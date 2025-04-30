package com.commitmate.re_cord.domain.post.post.repository;

import com.commitmate.re_cord.domain.post.post.entity.Post;
import com.commitmate.re_cord.domain.post.post.entity.PostStatus;
import com.commitmate.re_cord.domain.user.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post,Long> {

    @Query("SELECT p FROM Post p WHERE p.user.id = :userId")
    Page<Post> findMyPost(@Param("userId") Long userId, Pageable pageable);

    // 조회수 총합
    @Query("SELECT SUM(p.views) FROM Post p WHERE p.user.id = :userId")
    Long totalPostViews(@Param("userId") Long userId);

    //게시글 추천 총합
    @Query("SELECT SUM(p.likes) FROM Post p WHERE p.user.id = :userId")
    Long totalPostLikes(@Param("userId")Long userId);

    //조회수 순 게시글 정렬
    @Query("SELECT p FROM Post p WHERE p.user.id =:userId ORDER BY p.views DESC")
    Page<Post> orderPostsByViews(@Param("userId")Long userId, Pageable pageable);

    //좋아요 순 게시글 정렬
    @Query("SELECT p FROM Post p WHERE p.user.id =:userId ORDER BY p.likes DESC")
    Page<Post> orderPostsByLikes(@Param("userId")Long userId, Pageable pageable);

    //월별 조회수 통계

    // mysql 용
        @Query(value = "SELECT DATE_FORMAT(p.created_at, '%Y-%m') AS month, SUM(p.views) AS totalViews " +
                "FROM post p WHERE p.user_id = :userId " +
                "GROUP BY DATE_FORMAT(p.created_at, '%Y-%m') " +
                "ORDER BY DATE_FORMAT(p.created_at, '%Y-%m')",
                nativeQuery = true)
    List<Object[]> getMonthlyViews(@Param("userId") Long userId);

    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.images WHERE p.user = :user AND p.status = :status ORDER BY p.updatedAt DESC")
    Optional<Post> findTopByUserAndStatusOrderByUpdatedAtDescWithImages(
            @Param("user") User user,
            @Param("status") PostStatus status
    );


    // 카테고리와 PUBLISHED 인 게시글만 보는 메서드
    Page<Post> findAllByCategoryIdAndStatus(Long categoryId, PostStatus status, Pageable pageable);

    // 제목, 내용, 작성자 이름을 기준으로 검색하고, 상태가 EDITED 인 게시물만 가져오는 메서드
    @Query(
            value = """
    SELECT * FROM post
    WHERE status = 'PUBLISHED'
      AND (
        -- 제목에서 keyword가 일치하는 경우 (한글, 영어 구분)
        title LIKE CONCAT('%', :keyword, '%')
        OR
        -- 내용에서 keyword가 일치하는 경우 (HTML 태그 제외 후 한글, 영어 구분)
        REGEXP_REPLACE(content, '<img[^>]*>', '') LIKE CONCAT('%', :keyword, '%')
        OR
        -- 제목에서 영어 알파벳만 포함된 경우 keyword가 포함된 내용 찾기
        REGEXP_REPLACE(title, '[^a-zA-Z]', '') LIKE CONCAT('%', :keyword, '%')
        OR
        -- 제목에서 한글만 포함된 경우 keyword가 포함된 내용 찾기
        REGEXP_REPLACE(title, '[^가-힣]', '') LIKE CONCAT('%', :keyword, '%')
        OR
        -- 내용에서 영어 알파벳만 포함된 경우 keyword가 포함된 내용 찾기
        REGEXP_REPLACE(content, '[^a-zA-Z]', '') LIKE CONCAT('%', :keyword, '%')
        OR
        -- 내용에서 한글만 포함된 경우 keyword가 포함된 내용 찾기
        REGEXP_REPLACE(content, '[^가-힣]', '') LIKE CONCAT('%', :keyword, '%')
      )
    ORDER BY created_at DESC
    """,
            countQuery = """
    SELECT COUNT(*) FROM post
    WHERE status = 'PUBLISHED'
      AND (
        -- 제목에서 keyword가 일치하는 경우 (한글, 영어 구분)
        title LIKE CONCAT('%', :keyword, '%')
        OR
        -- 내용에서 keyword가 일치하는 경우 (HTML 태그 제외 후 한글, 영어 구분)
        REGEXP_REPLACE(content, '<img[^>]*>', '') LIKE CONCAT('%', :keyword, '%')
        OR
        -- 제목에서 영어 알파벳만 포함된 경우 keyword가 포함된 내용 찾기
        REGEXP_REPLACE(title, '[^a-zA-Z]', '') LIKE CONCAT('%', :keyword, '%')
        OR
        -- 제목에서 한글만 포함된 경우 keyword가 포함된 내용 찾기
        REGEXP_REPLACE(title, '[^가-힣]', '') LIKE CONCAT('%', :keyword, '%')
        OR
        -- 내용에서 영어 알파벳만 포함된 경우 keyword가 포함된 내용 찾기
        REGEXP_REPLACE(content, '[^a-zA-Z]', '') LIKE CONCAT('%', :keyword, '%')
        OR
        -- 내용에서 한글만 포함된 경우 keyword가 포함된 내용 찾기
        REGEXP_REPLACE(content, '[^가-힣]', '') LIKE CONCAT('%', :keyword, '%')
      )
    """,
            nativeQuery = true
    )
    Page<Post> searchVisiblePosts(@Param("keyword") String keyword, Pageable pageable);






    // 상태가 EDITED 인 게시물만 가져오는 메서드
    Page<Post> findAllByStatus(PostStatus status, Pageable pageable);

    // 특정 시간이 지난 게시물을 가져오는 메서드
    List<Post> findAllByStatusAndUpdatedAtBefore(PostStatus status, LocalDateTime time);

    // 특정 유저의 특정 상태의 게시물을 삭제하는 메서드
    void deleteByUserAndStatus(User user, PostStatus status);

    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.images WHERE p.id = :id")
    Optional<Post> findByIdWithImages(@Param("id") Long id);

    @Query("SELECT p.likes FROM Post p WHERE p.id = :postId")
    Optional<Integer> findLikesById(@Param("postId") Long postId);

    @Query("SELECT p.views FROM Post p WHERE p.id = :postId")
    Optional<Integer> findViewsById(@Param("postId") Long postId);

    @Query("""
    SELECT p 
    FROM Post p 
    LEFT JOIN FETCH p.images 
    WHERE p.user.id = :userId 
      AND p.status = :status
      AND p.createdAt = (
          SELECT MAX(p2.createdAt) 
          FROM Post p2 
          WHERE p2.user.id = :userId 
            AND p2.status = :status
      )
""")
    Optional<Post> findTopByUserIdWithImagesAndStatus(@Param("userId") Long userId,
                                                      @Param("status") PostStatus status);


    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.images WHERE p.user.id = :userId AND p.id <> :excludedPostId")
    List<Post> findByUserIdAndIdNotFetchImages(Long userId, Long excludedPostId);

    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.images WHERE p.user.id = :userId AND p.status = :status")
    Page<Post> findAllByUserIdWithImagesAndStatus(@Param("userId") Long userId, @Param("status") PostStatus status, Pageable pageable);


    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.images WHERE p.user.id = :userId AND p.status = :status")
    List<Post> findAllByUserIdWithImagesAndStatus(@Param("userId") Long userId, @Param("status") PostStatus status);


    // 최근 사진 있는 포스트 4개
    @Query("""
    SELECT p FROM Post p
    LEFT JOIN p.images i
    WHERE SIZE(p.images) > 0
      AND p.status = :status
    ORDER BY p.createdAt DESC
""")
    Page<Post> findRecentPostsWithImagesByStatus(@Param("status") PostStatus status, Pageable pageable);



    // 최근 일주일간 추천순 4개
    @Query("""
    SELECT p FROM Post p
    WHERE p.createdAt >= :thisMonday
      AND p.status = :status
    ORDER BY p.likes DESC
""")
    Page<Post> findWeeklyPopularPostsByStatus(@Param("thisMonday") LocalDateTime thisMonday,
                                              @Param("status") PostStatus status,
                                              Pageable pageable);

    //부트캠프 별 인기 게시물
    @Query("""
    SELECT p FROM Post p
    WHERE p.user.bootcamp = :bootcamp
      AND p.status = :status 
    ORDER BY p.likes DESC, p.createdAt DESC
""")
    Page<Post> findPopularPostsByBootcamp(@Param("bootcamp") String bootcamp, @Param("status") PostStatus status, Pageable pageable);



    @Query("""
    SELECT COUNT(p) 
    FROM Post p 
    WHERE p.user.id = :userId 
      AND p.status = :status
""")
    Long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") PostStatus status);



}
