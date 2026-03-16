package com.SpringReactJS.PracticeJavaSpringReactJS.controller;

import lombok.Data;

@Data
public class AuthRequest {
    private String username;
    private String displayName;
    private String email;
    private String password;
}
