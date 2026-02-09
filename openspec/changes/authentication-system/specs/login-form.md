# Spec: Login Form

## Overview
The LoginForm component provides a dual-mode login interface supporting both password and Magic Link authentication.

## Requirements

### REQ-1: Authentication Mode Toggle
- **MUST** support two modes: "password" and "magic"
- **MUST** display toggle buttons for mode selection
- **MUST** persist selected mode during session
- **MUST** default to "password" mode

### REQ-2: Password Mode
- **MUST** display email input field
- **MUST** display password input field
- **MUST** display "Forgot password?" link
- **MUST** validate email format
- **MUST** require password field

### REQ-3: Magic Link Mode
- **MUST** display only email input field
- **MUST** hide password field
- **MUST** display "Send Magic Link" button
- **MUST** show success state after sending

### REQ-4: Password Reset
- **MUST** trigger on "Forgot password?" click
- **MUST** require email to be filled
- **MUST** show error if email is empty
- **MUST** show success state after sending

### REQ-5: Success States
- **MUST** show "Magic Link sent" message after OTP request
- **MUST** show "Reset link sent" message after password reset
- **MUST** display the email address confirmation
- **MUST** provide "try again" option

### REQ-6: Error Handling
- **MUST** display error messages in red box
- **MUST** clear errors on form resubmission
- **MUST** show loading state during submission

## UI States

### Default State (Password Mode)
```
[Contrasena] [Magic Link]  <- toggle (Contrasena selected)

Correo electronico
[email input]

Contrasena               Olvidaste tu contrasena?
[password input]

[Iniciar sesion] <- button
```

### Default State (Magic Link Mode)
```
[Contrasena] [Magic Link]  <- toggle (Magic Link selected)

Correo electronico
[email input]

[Enviar Magic Link] <- button
```

### Magic Link Sent State
```
[envelope icon]
Revisa tu correo

Enviamos un enlace de acceso a
user@example.com

[Volver a intentar]
```

### Reset Link Sent State
```
[key icon]
Revisa tu correo

Enviamos un enlace para restablecer tu contrasena a
user@example.com

[Volver a iniciar sesion]
```

### Error State
```
[error box with red border]
Error message here

[form fields continue below]
```

## Props Interface

```typescript
interface LoginFormProps {
  onSuccess?: () => void;           // Called after successful login
  onSwitchToRegister?: () => void;  // Shows register link if provided
}
```

## Validation Rules

| Field | Rule |
|-------|------|
| Email | Required, valid email format |
| Password | Required (password mode only) |

## Accessibility

- All inputs have associated labels
- Error messages are screen-reader accessible
- Loading state disables button to prevent double-submit
- Focus management on mode switch
