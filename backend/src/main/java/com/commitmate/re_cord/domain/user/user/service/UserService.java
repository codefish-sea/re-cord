package com.commitmate.re_cord.domain.user.user.service;


import com.commitmate.re_cord.domain.user.user.dto.SignupDto;
import com.commitmate.re_cord.domain.user.user.dto.UserIdResponseDto;
import com.commitmate.re_cord.domain.user.user.entity.User;
import com.commitmate.re_cord.domain.user.user.enums.Provider;
import com.commitmate.re_cord.domain.user.user.enums.Role;
import com.commitmate.re_cord.domain.user.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;

import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;


import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final AuthTokenService authTokenService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // 일반 회원가입
    @Transactional
    public String register(SignupDto dto) {
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            return "Email already exists";
        }

        // 비밀번호 인코딩
        String encodedPassword = passwordEncoder.encode(dto.getPassword());
        // 블로그명 생성
        String blogName = generateBlogName(dto.getEmail());


        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(encodedPassword);
//        user.setPassword(dto.getPassword());
        user.setUsername(dto.getUsername());
        user.setBootcamp(dto.getBootcamp());
        user.setGeneration(dto.getGeneration());
        user.setRole(Role.basic);
        user.setBlogName(blogName);
        user.setProfileImageUrl("https://re-cord.s3.ap-northeast-2.amazonaws.com/user/profile/default-profile.png");
        userRepository.save(user);
        return "User registered successfully";
    }
    // 블로그명 생성 로직
    private String generateBlogName(String email) {
        String emailPrefix = email.split("@")[0];  // 이메일의 '@' 앞부분
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);  // 난수 생성 (8자리)
        return emailPrefix + "_" + randomSuffix;  // 예: testuser_12345678
    }
    // 이메일 중복 검사
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }


    // 일반 로그인
    @Transactional
    public String login(String email, String password) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            User user = userOptional.get();

            if (passwordEncoder.matches(password, user.getPassword())) {
                String refreshToken = UUID.randomUUID().toString();
                user.setRefreshToken(refreshToken);
                userRepository.save(user);

//            // 평문 비교 (보안 위험 있음 - 테스트용만)
//            if (password.equals(user.getPassword())) {
//                String refreshToken = UUID.randomUUID().toString();
//                user.setRefreshToken(refreshToken);
//                userRepository.save(user);

                String accessToken = authTokenService.genAccessToken(user);
                return user.getRefreshToken() + " " + accessToken;
            }
        }

        return null;
    }

//    // 로그아웃 - 그냥 요청 클라이언트 쿠키 삭제하는 걸로
//    @Transactional
//    public void logout() {
//        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
//
//        if (auth != null && auth.isAuthenticated()) {
//            Object principal = auth.getPrincipal();
//            Long userId = principal
//        }



//        user.setRefreshToken(null); // refreshToken 제거
//        userRepository.save(user);  // 변경사항 저장
//    }

    // 회원가입
    @Transactional
    public void withdraw(Long userId) {
        userRepository.deleteById(userId);
    }

    // 소셜 로그인
    public long count() {
        return userRepository.count();
    }

    public User join(String oauthId, String username, String password, Provider provider) {
        userRepository
                .findByUsername(username)
                .ifPresent(member -> {
                    throw new RuntimeException("해당 username은 이미 사용중입니다.");
                });

        User user = User.builder()
                .oauthId(oauthId)
                .username(username)
                .password(password)
                .provider(provider)
                .refreshToken(UUID.randomUUID().toString())
                .profileImageUrl("https://re-cord.s3.ap-northeast-2.amazonaws.com/user/profile/default-profile.png")
                .build();

        return userRepository.save(user);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findById(long authorId) {
        return userRepository.findById(authorId);
    }

    public Optional<User> findByRefreshToken(String refreshToken) {
        return userRepository.findByRefreshToken(refreshToken);
    }

    public String genAccessToken(User user) {
        return authTokenService.genAccessToken(user);
    }

    public String genAuthToken(User user) {
        return user.getRefreshToken() + " " + genAccessToken(user);
    }

    public User getMemberFromAccessToken(String accessToken) {
        Map<String, Object> payload = authTokenService.payload(accessToken);

        if (payload == null) return null;

        long id = (long) payload.get("id");
        String username = (String) payload.get("username");

        return new User(id, username);
    }

    public void modify(User user, @NotBlank String username) {
        user.setUsername(username);
    }

    public User modifyOrJoin(String username, String nickname, Provider provider) {
        Optional<User> opMember = findByUsername(username);

        if (opMember.isPresent()) {
            User user = opMember.get();
            modify(user, nickname);
            user.setProvider(provider);
            return user;
        }

        return join(username, "", nickname, provider);
    }


    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("해당 사용자를 찾을 수 없습니다."));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException(email + ": 해당 이메일을 찾을 수 없습니다."));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    // 소셜 로그인 시 임시 유저 생성
    public User createTempUser(String oauthId, String username, String email, Provider provider, String profileImageUrl) {
        // 이미 존재하면 그대로 반환

        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null) {
            // 유저가 존재하지 않으면 새로운 유저 생성
            user = User.builder()
                    .oauthId(oauthId)
                    .username(username)
                    .email(email)
                    .provider(provider)
                    .refreshToken(UUID.randomUUID().toString())
                    .profileImageUrl("https://re-cord.s3.ap-northeast-2.amazonaws.com/user/profile/default-profile.png ")
                    .role(Role.basic)
                    .profileImageUrl(profileImageUrl)
                    .build();

            // 유저 저장
            User savedUser = userRepository.save(user);

            // 로그 확인
            log.info("임시 유저 생성 완료 - oauthId: {}, username: {}, email: {}, provider: {}",
                    savedUser.getOauthId(), savedUser.getUsername(), savedUser.getEmail(), savedUser.getProvider());
            return savedUser;
        } else {
            // 유저가 존재하면 기존 유저 반환
            return user;
        }
    }

    @Transactional
    public User completeOAuth2Signup(String oauthId, String email, String bootcamp, String generation) {
        System.out.println(oauthId);
        User user = userRepository.findByOauthId(oauthId)
                .orElseThrow(() -> new RuntimeException("임시 계정이 없습니다"));

        user.setEmail(email);
        user.setBootcamp(bootcamp);
        user.setGeneration(generation);
        user.setRefreshToken(UUID.randomUUID().toString());

        // 블로그명 생성
        String blogName = generateBlogName(email);
        user.setBlogName(blogName);

        return userRepository.save(user);
    }

    public String getProfileImageUrl(Long userId) {
        return userRepository.findById(userId)
                .map(User::getProfileImageUrl)
                .orElse(null); // 사용자가 없으면 null 반환 또는 예외 처리
    }

    public UserIdResponseDto getUserIdByBlogName(String blogName) {
        return userRepository.findByBlogName(blogName)
                .map(user -> new UserIdResponseDto(user.getId()))
                .orElse(null); // 못 찾으면 null 반환
    }
}
