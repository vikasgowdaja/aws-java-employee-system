package com.SpringReactJS.PracticeJavaSpringReactJS.controller;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.SpringReactJS.PracticeJavaSpringReactJS.model.User;
import com.SpringReactJS.PracticeJavaSpringReactJS.repository.UserRepository;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        String username = request.getUsername() == null ? null : request.getUsername().trim();
        String email = request.getEmail() == null ? null : request.getEmail().trim();
        String displayName = request.getDisplayName() == null ? null : request.getDisplayName().trim();

        if (username == null || username.isBlank() || request.getPassword() == null || request.getPassword().isBlank()
                || email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("username, email and password are required");
        }

        if (displayName == null || displayName.isBlank()) {
            displayName = username;
        }

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already exists");
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
        }

        User saved = userRepository.save(User.builder()
                .username(username)
                .displayName(displayName)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .build());

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(new AuthResponse(UUID.randomUUID().toString(), saved.getUsername(), saved.getDisplayName(),
                saved.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("username and password required");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }

        return ResponseEntity.ok(new AuthResponse(UUID.randomUUID().toString(), user.getUsername(),
            user.getDisplayName(), user.getEmail()));
    }
}