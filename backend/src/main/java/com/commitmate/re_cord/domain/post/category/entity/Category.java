package com.commitmate.re_cord.domain.post.category.entity;

import com.commitmate.re_cord.domain.post.post.entity.Post;
import com.commitmate.re_cord.domain.user.user.entity.User;  // User 클래스 import 추가
import com.commitmate.re_cord.global.jpa.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "category")
@JsonIgnoreProperties({"user"})  // User 정보 직렬화에서 제외
public class Category extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int postCount;

    // User와의 ManyToOne 관계 설정
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)  // 카테고리마다 user_id 외래키 설정
    private User user;

    @OneToMany(mappedBy = "category", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JsonIgnore
    private List<Post> posts = new ArrayList<>();


}
