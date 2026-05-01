import { form, getRequestEvent } from "$app/server";
import { z } from "zod";
import { auth } from "./auth";
import { invalid, redirect } from "@sveltejs/kit";

function hasErrorCode(error: unknown): error is { body: { code: string } } {
    if (typeof error !== "object" || error === null) return false;

    const body = (error as { body?: unknown }).body;
    if (typeof body !== "object" || body === null) return false;

    const code = (body as { code?: unknown }).code;
    return typeof code === "string";
}

const SignUpEmailPasswordSchema = z.object({
    name: z.string().trim().min(2, "Name is required"),
    email: z.string().trim().pipe(z.email("This is not a valid e-mail")),
    _password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    /** Consent checkbox: native checkboxes may submit `"on"` or `true`. */
    acceptTerms: z.union([z.literal(true), z.literal("on")]).optional(),
});

export const emailPasswordSignUpForm = form(
    SignUpEmailPasswordSchema,
    async ({ email, _password, name, confirmPassword, acceptTerms }, issue) => {
        if (_password !== confirmPassword) {
            return invalid(issue.confirmPassword("Passwords do not match."));
        }
        if (acceptTerms !== true && acceptTerms !== "on") {
            return invalid(
                issue.acceptTerms(
                    "Please accept the Terms of Service and Privacy Policy to continue.",
                ),
            );
        }

        let data;
        try {
            data = await auth.api.signUpEmail({
                body: {
                    name,
                    email,
                    password: _password,
                    callbackURL: "/auth/login"
                },
            });
        } catch (error) {
            if (hasErrorCode(error)) {
                if (error.body.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
                    return invalid(issue.email("An account with this email already exists."));
                }
            }
            console.error(error);
            invalid(issue("An unexpected error occurred during sign up."));
        }
        redirect(303, "/auth/login");
    },
);

const SignInEmailPasswordSchema = z.object({
    email: z.string().trim().pipe(z.email("This is not a valid e-mail")),
    _password: z.string(),
});

export const emailPasswordSignInForm = form(
    SignInEmailPasswordSchema,
    async ({ email, _password }, issue) => {
        let data;
        try {
            data = await auth.api.signInEmail({
                body: {
                    email,
                    password: _password,
                    rememberMe: true,
                    callbackURL: "/",
                },
            });
        } catch (error) {
            if (hasErrorCode(error)) {
                if (error.body.code === "EMAIL_NOT_VERIFIED") {
                    return invalid(issue("Please verify your email before signing in."));
                }
                if (error.body.code === "INVALID_EMAIL_OR_PASSWORD") {
                    return invalid(issue("Invalid email or password."));
                }
            }
            invalid(issue("An unexpected error occurred during sign in."));
        }
        redirect(303, data?.url ?? "/");
    },
);