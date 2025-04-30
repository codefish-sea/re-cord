package com.commitmate.re_cord.domain.post.post.dto;


import com.commitmate.re_cord.domain.post.post.entity.Post;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class PostDTO {
    private Long id;
    private Long userId;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private int views;
    private int likes;



    public static PostDTO getEntity(Post post){
        return new PostDTO(
                post.getId(),
                post.getUser().getId(),
                post.getTitle(),
                post.getContent(),
                post.getCreatedAt(),
                post.getViews(),
                post.getLikes()
        );
    }

}
