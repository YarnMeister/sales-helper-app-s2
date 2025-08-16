export class AppError extends Error { 
  status = 500; 
  code = "ERR_APP"; 
  data?: unknown; 
  
  constructor(message: string, data?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.data = data;
  }
}

export class ValidationError extends AppError { 
  status = 422; 
  code = "ERR_VALIDATION";
  
  constructor(message: string, data?: unknown) {
    super(message, data);
  }
}

export class NotFoundError extends AppError { 
  status = 404; 
  code = "ERR_NOT_FOUND";
  
  constructor(message: string = "Resource not found", data?: unknown) {
    super(message, data);
  }
}

export class ExternalError extends AppError { 
  status = 502; 
  code = "ERR_EXTERNAL";
  
  constructor(message: string, data?: unknown) {
    super(message, data);
  }
}

export function errorToResponse(err: unknown) {
  const e = err as AppError;
  const body = { 
    ok: false, 
    code: (e as any).code || "ERR_UNKNOWN", 
    message: e.message || "An unknown error occurred",
    data: (e as any).data 
  };
  return new Response(JSON.stringify(body), { 
    status: (e as any).status || 500, 
    headers: { "content-type": "application/json" }
  });
}
