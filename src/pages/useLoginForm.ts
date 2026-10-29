import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { emailToUsername, usernameToEmail } from "@/lib/auth";
import { DESKTOP_MEDIA_QUERY } from "@/lib/layout";
import { playSound } from "@/lib/sound";
import type { LoginMessageKey } from "./login-translations";

type LoginError =
  | { field: "username"; message: "usernameRequired" }
  | { field: "password"; message: "passwordRequired" }
  | {
      field: "form";
      message: Exclude<LoginMessageKey, "usernameRequired" | "passwordRequired">;
    };

const SAVED_USERNAME_KEY = "reclutamiento_saved_email";

function readSavedUsername() {
  try {
    return localStorage.getItem(SAVED_USERNAME_KEY);
  } catch {
    return null;
  }
}

function persistSavedUsername(username: string | null) {
  try {
    if (username) localStorage.setItem(SAVED_USERNAME_KEY, username);
    else localStorage.removeItem(SAVED_USERNAME_KEY);
  } catch {
    // Inicio de sesión sigue disponible cuando almacenamiento está bloqueado.
  }
}

export function useLoginForm(onRememberedUsernameChange: (username: string | null) => void) {
  const { signIn, completeLoginTransition } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successAttemptId, setSuccessAttemptId] = useState<number | null>(null);
  const submittingRef = useRef(false);
  const successfulRef = useRef(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [capsLock, setCapsLock] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = readSavedUsername();
    if (saved) {
      const savedUsername = emailToUsername(usernameToEmail(saved));
      setUsername(savedUsername);
      onRememberedUsernameChange(savedUsername);
      setRememberMe(true);
    }

    if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) return;
    const frame = requestAnimationFrame(() => {
      (saved ? passwordRef : usernameRef).current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [onRememberedUsernameChange]);

  const handlePasswordKeyEvent = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState("CapsLock"));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || successfulRef.current) return;
    setError(null);
    setIsSuccess(false);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError({ field: "username", message: "usernameRequired" });
      playSound("error", { emphasis: "subtle" });
      usernameRef.current?.focus();
      return;
    }
    if (!password) {
      setError({ field: "password", message: "passwordRequired" });
      playSound("error", { emphasis: "subtle" });
      passwordRef.current?.focus();
      return;
    }

    playSound("tap");
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const result = await signIn(trimmedUsername, password);
      if (!result.ok) {
        setError({
          field: "form",
          message: result.message === "Usuario o contraseña incorrectos."
            ? "invalidCredentials"
            : result.message?.startsWith("Cuenta sin confirmar.")
              ? "unconfirmedAccount"
              : "genericError",
        });
        playSound("error");
        return;
      }

      const savedUsername = rememberMe ? trimmedUsername : null;
      persistSavedUsername(savedUsername);
      onRememberedUsernameChange(savedUsername);
      playSound("success");
      successfulRef.current = true;
      setSuccessAttemptId(result.loginAttemptId);
      setIsSuccess(true);
    } catch {
      setError({ field: "form", message: "genericError" });
      playSound("error");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return {
    username, setUsername, password, setPassword,
    showPassword, setShowPassword, rememberMe, setRememberMe,
    submitting, isSuccess, error, setError, capsLock, setCapsLock,
    usernameRef, passwordRef, handlePasswordKeyEvent, handleSubmit,
    onSuccessAnimationComplete: () => {
      if (successAttemptId !== null) completeLoginTransition(successAttemptId);
    },
  };
}
