import { toast } from 'sonner'

interface ToastOptions {
  description?: string
  duration?: number
}

export const showToast = {
  success: (title: string, options?: ToastOptions) => {
    toast.success(title, {
      description: options?.description,
      duration: options?.duration,
    })
  },
  error: (title: string, options?: ToastOptions) => {
    toast.error(title, {
      description: options?.description,
      duration: options?.duration,
    })
  },
  info: (title: string, options?: ToastOptions) => {
    toast.info(title, {
      description: options?.description,
      duration: options?.duration,
    })
  },
  warning: (title: string, options?: ToastOptions) => {
    toast.warning(title, {
      description: options?.description,
      duration: options?.duration,
    })
  },
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string
      error: string
    }
  ) => {
    return toast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
    })
  },
} 