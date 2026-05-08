import type { AxiosError } from 'axios';
import toast from 'react-hot-toast';

/**
 * Convert any error (axios, validation, plain Error) into a readable string.
 * Handles three common ASP.NET Core response shapes:
 *  - { message: "..." }                                  // our custom errors
 *  - { title: "...", errors: { Field: ["msg1", "msg2"] }} // [ApiController] validation
 *  - { title: "..." }                                    // plain ProblemDetails
 *  - plain string body
 */
export function humanizeError(err: unknown, fallback = 'Something went wrong'): string {
  // axios errors
  const ax = err as AxiosError<unknown>;
  if (ax?.isAxiosError) {
    const data = ax.response?.data as Record<string, unknown> | string | undefined;

    if (typeof data === 'string' && data.trim()) return data;

    if (data && typeof data === 'object') {
      // Custom { message } shape from our own controllers
      if (typeof data.message === 'string' && data.message.trim()) return data.message;

      // ASP.NET ModelState validation
      if (data.errors && typeof data.errors === 'object') {
        const errors = data.errors as Record<string, string[]>;
        const lines: string[] = [];
        for (const [field, msgs] of Object.entries(errors)) {
          if (Array.isArray(msgs)) {
            for (const m of msgs) {
              lines.push(field === '$' || !field ? m : `${prettyField(field)}: ${m}`);
            }
          }
        }
        if (lines.length) return lines.join('\n');
      }

      // ProblemDetails title/detail
      if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
      if (typeof data.title === 'string' && data.title.trim()) return data.title;
    }

    // Network or no-response
    if (ax.code === 'ERR_NETWORK') return 'Could not reach the server. Check your connection.';
    if (ax.response?.status === 401) return 'Your session has expired. Please sign in again.';
    if (ax.response?.status === 403) return "You don't have permission to do that.";
    if (ax.response?.status === 404) return 'Not found.';
    if (ax.response?.status && ax.response.status >= 500) {
      return 'Server error. Please try again or contact support.';
    }

    if (ax.message) return ax.message;
  }

  // Plain Error
  if (err instanceof Error && err.message) return err.message;

  return fallback;
}

function prettyField(name: string): string {
  // "FullName" → "Full name", "customerId" → "Customer id"
  const spaced = name.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/**
 * Show an error toast with a humanized message. Longer duration so users
 * can read multi-line validation output.
 */
export function showError(err: unknown, fallback?: string) {
  const msg = humanizeError(err, fallback);
  toast.error(msg, {
    duration: 6000,
    style: { maxWidth: 480, whiteSpace: 'pre-line' },
  });
}
