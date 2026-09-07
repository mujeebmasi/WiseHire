// One place for every call to the backend.

import type { Application, Company, Job, Stage, User } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

// The login token is kept in localStorage so it survives a page refresh.
export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

// Thrown for any failed request. `status` lets the apply page tell a
// "you are not verified" 403 apart from an ordinary error.
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Every request goes through here so the token and error handling
// are written once instead of in every function.
async function request(path: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  // FormData sets its own Content-Type (it has to include a boundary),
  // so only set JSON when we are not sending a file.
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(API_URL + path, { ...options, headers });
  } catch {
    // fetch only throws when the request never reached the server.
    throw new ApiError(`Cannot reach the API. Is the backend running?`, 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Nest sends message as a string, or an array when validation failed.
    const message = Array.isArray(data?.message)
      ? data.message.join('. ')
      : (data?.message ?? 'Something went wrong');
    throw new ApiError(message, response.status);
  }

  return data;
}

// Caught errors are typed `unknown` in TypeScript, because code can throw
// anything, not just an Error. This pulls out a message safely.
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

export const api = {
  // --- auth ---
  register: (body: {
    email: string;
    password: string;
    name: string;
    role: 'CANDIDATE' | 'EMPLOYER';
  }): Promise<{ user: User; token: string }> =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: {
    email: string;
    password: string;
  }): Promise<{ user: User; token: string }> =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: (): Promise<User> => request('/auth/me'),

  verify: (body: { aadhaarNumber: string; otp: string }): Promise<User> =>
    request('/auth/verify', { method: 'POST', body: JSON.stringify(body) }),

  // --- company (employers only) ---
  // Returns null when the employer has not added their company yet.
  getMyCompany: (): Promise<Company | null> => request('/company/mine'),

  createCompany: (body: {
    name: string;
    description?: string;
    website?: string;
  }): Promise<Company> =>
    request('/company', { method: 'POST', body: JSON.stringify(body) }),

  // --- jobs ---
  getJobs: (filters: {
    search?: string;
    type?: string;
    workMode?: string;
  }): Promise<Job[]> => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.type) params.set('type', filters.type);
    if (filters.workMode) params.set('workMode', filters.workMode);
    const query = params.toString();
    return request('/jobs' + (query ? `?${query}` : ''));
  },

  getJob: (id: string): Promise<Job> => request(`/jobs/${id}`),

  getMyJobs: (): Promise<Job[]> => request('/jobs/mine'),

  createJob: (body: {
    title: string;
    description: string;
    type: string;
    workMode?: string;
    location?: string;
    skills?: string[];
    minVerification?: string;
    salaryMin?: number;
    salaryMax?: number;
  }): Promise<Job> =>
    request('/jobs', { method: 'POST', body: JSON.stringify(body) }),

  setJobOpen: (id: string, isOpen: boolean): Promise<Job> =>
    request(`/jobs/${id}/open`, {
      method: 'PATCH',
      body: JSON.stringify({ isOpen }),
    }),

  // --- applications ---
  // The file goes up as FormData, the same way a normal HTML form would
  // send it. The API stores it in S3.
  apply: (jobId: string, resume: File, coverNote: string): Promise<Application> => {
    const form = new FormData();
    form.append('resume', resume);
    if (coverNote) form.append('coverNote', coverNote);
    return request(`/jobs/${jobId}/apply`, { method: 'POST', body: form });
  },

  getMyApplications: (): Promise<Application[]> => request('/applications/mine'),

  getApplicants: (jobId: string): Promise<Application[]> =>
    request(`/jobs/${jobId}/applications`),

  // Employers use this to change the stage, to write back to the candidate,
  // or both. Send only the part that changed.
  updateApplication: (
    id: string,
    changes: { stage?: Stage; employerMessage?: string },
  ): Promise<Application> =>
    request(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),

  // This one does not go through request(), because the reply is a PDF
  // file rather than JSON.
  getResumeFile: async (id: string): Promise<Blob> => {
    const token = getToken();

    const response = await fetch(`${API_URL}/applications/${id}/resume`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new ApiError('Could not open this resume', response.status);
    }

    return response.blob();
  },
};
