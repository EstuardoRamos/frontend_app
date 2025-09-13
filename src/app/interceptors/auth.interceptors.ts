// src/app/interceptors/auth.interceptor.ts
import { Injectable, inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '@/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;

  if (token) {
    const clone = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(clone);
  }

  return next(req);
};