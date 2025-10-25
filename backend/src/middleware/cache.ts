import { Request, Response, NextFunction } from 'express';

export interface CacheOptions {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  staleIfError?: number;
  mustRevalidate?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  public?: boolean;
  private?: boolean;
  immutable?: boolean;
}

export const setCache = (options: CacheOptions) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    const cacheDirectives: string[] = [];

    if (options.noStore) {
      cacheDirectives.push('no-store');
      res.setHeader('Cache-Control', cacheDirectives.join(', '));
      return next();
    }

    if (options.noCache) {
      cacheDirectives.push('no-cache');
    }

    if (options.public) {
      cacheDirectives.push('public');
    } else if (options.private) {
      cacheDirectives.push('private');
    }

    if (options.maxAge !== undefined) {
      cacheDirectives.push(`max-age=${options.maxAge}`);
    }

    if (options.sMaxAge !== undefined) {
      cacheDirectives.push(`s-maxage=${options.sMaxAge}`);
    }

    if (options.staleWhileRevalidate !== undefined) {
      cacheDirectives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
    }

    if (options.staleIfError !== undefined) {
      cacheDirectives.push(`stale-if-error=${options.staleIfError}`);
    }

    if (options.mustRevalidate) {
      cacheDirectives.push('must-revalidate');
    }

    if (options.immutable) {
      cacheDirectives.push('immutable');
    }

    if (cacheDirectives.length > 0) {
      res.setHeader('Cache-Control', cacheDirectives.join(', '));
    }

    next();
  };
};

export const cachePresets = {
  noCache: setCache({ noStore: true }),
  
  short: setCache({ 
    public: true, 
    maxAge: 300,
    staleWhileRevalidate: 60 
  }),

  medium: setCache({ 
    public: true, 
    maxAge: 3600,
    staleWhileRevalidate: 300 
  }),

  long: setCache({ 
    public: true, 
    maxAge: 86400,
    staleWhileRevalidate: 3600 
  }),
  
  privateShort: setCache({ 
    private: true, 
    maxAge: 300,
    mustRevalidate: true 
  }),

  privateMedium: setCache({ 
    private: true, 
    maxAge: 3600,
    mustRevalidate: true 
  }),
  
  immutableStatic: setCache({ 
    public: true, 
    maxAge: 31536000,
    immutable: true 
  }),
};

export const setCacheHeader = (res: Response, options: CacheOptions) => {
  const cacheDirectives: string[] = [];

  if (options.noStore) {
    res.setHeader('Cache-Control', 'no-store');
    return;
  }

  if (options.noCache) {
    cacheDirectives.push('no-cache');
  }

  if (options.public) {
    cacheDirectives.push('public');
  } else if (options.private) {
    cacheDirectives.push('private');
  }

  if (options.maxAge !== undefined) {
    cacheDirectives.push(`max-age=${options.maxAge}`);
  }

  if (options.sMaxAge !== undefined) {
    cacheDirectives.push(`s-maxage=${options.sMaxAge}`);
  }

  if (options.staleWhileRevalidate !== undefined) {
    cacheDirectives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  if (options.staleIfError !== undefined) {
    cacheDirectives.push(`stale-if-error=${options.staleIfError}`);
  }

  if (options.mustRevalidate) {
    cacheDirectives.push('must-revalidate');
  }

  if (options.immutable) {
    cacheDirectives.push('immutable');
  }

  if (cacheDirectives.length > 0) {
    res.setHeader('Cache-Control', cacheDirectives.join(', '));
  }
};
