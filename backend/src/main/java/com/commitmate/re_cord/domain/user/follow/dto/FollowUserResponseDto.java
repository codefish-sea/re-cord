package com.commitmate.re_cord.domain.user.follow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class FollowUserResponseDto {
    private Long userId;
    private String username;
    private String email;
    private boolean hasFollowed;
    private String blogName;  // 새로 추가한 필드
}
