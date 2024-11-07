// types/auth.ts

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SignupFormValues {
  name: string;
  email: string;
  address: string;
  phoneNumber: string;
  password: string;
}

export interface ForgotPasswordFormValues {
  email: string;
}
