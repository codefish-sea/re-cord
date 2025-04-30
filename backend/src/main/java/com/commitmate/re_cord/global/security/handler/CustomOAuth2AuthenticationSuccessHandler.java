package com.commitmate.re_cord.global.security.handler;

import com.commitmate.re_cord.domain.user.user.entity.User;
import com.commitmate.re_cord.domain.user.user.service.UserService;
import com.commitmate.re_cord.global.rq.Rq;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CustomOAuth2AuthenticationSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {
    private final UserService userService;
    private final Rq rq;

    @SneakyThrows
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        // rq.getActor() 시큐리티에서 로그인된 회원정보 가지고 오기
        User actor = userService.findById(rq.getActor().getId()).get();

        // 토큰 발급
        rq.makeAuthCookies(actor);

//        String redirectUrl = request.getParameter("state");

        String redirectUrl = request.getParameter("state");
        if (redirectUrl == null || redirectUrl.isBlank()) {
            redirectUrl = "https://www.re-cord.site/home"; // fallback URL
        }
        response.sendRedirect(redirectUrl);
    }

}
