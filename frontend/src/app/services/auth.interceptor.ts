import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Attaches the bearer token (the user id issued at login) to every request.
 * Kept trivial to match the backend's minimal auth scheme.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
