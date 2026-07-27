export type ErrorCategory =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'OCC_CONFLICT'
  | 'NOT_FOUND'
  | 'UNKNOWN_ERROR';

export interface AppError {
  category: ErrorCategory;
  message: string;
  originalError?: any;
}

export function classifyError(error: any): AppError {
  if (!error) {
    return { category: 'UNKNOWN_ERROR', message: 'Ocorreu um erro desconhecido.' };
  }

  const msg = typeof error === 'string' ? error : error?.message || '';

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_NAME_NOT_RESOLVED')) {
    return {
      category: 'NETWORK_ERROR',
      message: 'Falha de conexão com a nuvem. Verifique sua conexão com a internet ou as variáveis do Supabase.',
      originalError: error,
    };
  }

  if (msg.includes('Invalid login credentials') || msg.includes('Email not confirmed') || msg.includes('User not found')) {
    return {
      category: 'AUTH_ERROR',
      message: 'Credenciais de acesso incorretas ou usuário não encontrado.',
      originalError: error,
    };
  }

  if (msg.includes('OCC_CONFLICT') || msg.includes('versão')) {
    return {
      category: 'OCC_CONFLICT',
      message: 'Conflito de edição simultânea detectado. Outro parceiro alterou este registro.',
      originalError: error,
    };
  }

  if (msg.includes('obrigatória') || msg.includes('inválido') || msg.includes('excede')) {
    return {
      category: 'VALIDATION_ERROR',
      message: msg,
      originalError: error,
    };
  }

  return {
    category: 'UNKNOWN_ERROR',
    message: msg || 'Ocorreu uma falha inesperada no processamento dos dados.',
    originalError: error,
  };
}
