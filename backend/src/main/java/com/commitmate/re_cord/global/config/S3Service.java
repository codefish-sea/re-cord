package com.commitmate.re_cord.global.config;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Objects;
import java.util.UUID;



@Service
public class S3Service {

    @Value("${aws.access-key}")
    private String accessKey;

    @Value("${aws.secret-key}")
    private String secretKey;

    @Value("${aws.region}")
    private String region;

    @Value("${aws.s3.bucket}")
    private String bucket;

    private AmazonS3 amazonS3;

    @PostConstruct
    public void init() {
        BasicAWSCredentials awsCredentials = new BasicAWSCredentials(accessKey, secretKey);
        this.amazonS3 = AmazonS3ClientBuilder.standard()
                .withCredentials(new AWSStaticCredentialsProvider(awsCredentials))
                .withRegion(region)
                .build();
    }


    public String uploadImage(MultipartFile file, Long userId) throws IOException {
        System.out.println("uploadImage 진입 - 파일명: " + (file != null ? file.getOriginalFilename() : "파일 없음"));

        String ext = Objects.requireNonNull(file.getOriginalFilename())
                .substring(file.getOriginalFilename().lastIndexOf("."));
        String fileKey = "user/" + userId + "/images/" + UUID.randomUUID() + ext;

        System.out.println("생성된 fileKey: " + fileKey);

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType(file.getContentType());
        metadata.setContentLength(file.getSize());

        try {
            System.out.println("S3 업로드 시도");
            amazonS3.putObject(new PutObjectRequest(bucket, fileKey, file.getInputStream(), metadata));
            System.out.println("S3 업로드 성공");
        } catch (Exception e) {
            System.err.println("S3 업로드 실패");
            e.printStackTrace();
            throw e;
        }

        String fileUrl = getFileUrl(fileKey);
        System.out.println("생성된 fileUrl: " + fileUrl);

        return fileUrl;
    }


    // S3에서 파일 URL을 가져오는 메서드
    public String getFileUrl(String fileKey) {
        return amazonS3.getUrl(bucket, fileKey).toString();
    }

    // S3에서 이미지 삭제
    public void delete(String fileKey) {
        amazonS3.deleteObject(bucket, fileKey);
    }

    // deleteImage 메서드 (추가된 부분)
    public void deleteImage(String imageUrl) {
        try {
            String fileKey = extractKeyFromUrl(imageUrl);  // URL에서 파일 키 추출
            delete(fileKey);  // S3에서 파일 삭제
        } catch (Exception e) {
            throw new RuntimeException("이미지 삭제 실패: " + e.getMessage());
        }
    }

    // 이미지 URL에서 S3 키를 추출하는 메서드
    private String extractKeyFromUrl(String imageUrl) {
        // 예시: "https://s3.amazonaws.com/bucket-name/user/1/images/abc123.jpg"
        return imageUrl.substring(imageUrl.indexOf(bucket) + bucket.length() + 1);
    }
}
